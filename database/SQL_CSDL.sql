CREATE DATABASE bai_tap_lon_csdl;
GO
 
USE bai_tap_lon_csdl;
GO

-- Loại mặt hàng
CREATE TABLE CATEGORIES (
    id       INT           IDENTITY(1,1) PRIMARY KEY,
    ten_loai NVARCHAR(100) NOT NULL
);
GO
 
-- Mặt hàng
CREATE TABLE PRODUCTS (
    id              INT           IDENTITY(1,1) PRIMARY KEY,
    loai_id         INT           NOT NULL,
    ten_hang        NVARCHAR(150) NOT NULL,
    gia             DECIMAL(12,2) NOT NULL CHECK (gia >= 0),
    ton_kho         INT           NOT NULL DEFAULT 0 CHECK (ton_kho >= 0),
    nguong_canh_bao INT           NOT NULL DEFAULT 5  CHECK (nguong_canh_bao >= 0),
    don_vi          NVARCHAR(30)  NOT NULL DEFAULT N'cái',
 
    CONSTRAINT FK_Products_Categories FOREIGN KEY (loai_id)
        REFERENCES CATEGORIES(id)
);
GO
 
-- Khách hàng
CREATE TABLE CUSTOMERS (
    id            INT           IDENTITY(1,1) PRIMARY KEY,
    ho_ten        NVARCHAR(100) NOT NULL,
    so_dien_thoai VARCHAR(15)   NOT NULL UNIQUE
);
GO
 
-- Đơn hàng: hinh_thuc: 'tu_den' + 'giao_hang' 
CREATE TABLE ORDERS (
    id            INT           IDENTITY(1,1) PRIMARY KEY,
    khach_hang_id INT           NOT NULL,
    ngay_tao      DATETIME      NOT NULL DEFAULT GETDATE(),
    hinh_thuc     NVARCHAR(15)  NOT NULL
                      CONSTRAINT CHK_Orders_HinhThuc
                      CHECK (hinh_thuc IN (N'tu_den', N'giao_hang')),
    gio_nhan      DATETIME      NULL,
    dia_chi_giao  NVARCHAR(255) NULL,
    trang_thai    NVARCHAR(15)  NOT NULL DEFAULT N'cho'
                      CONSTRAINT CHK_Orders_TrangThai
                      CHECK (trang_thai IN (N'cho', N'dang_giao', N'xong', N'huy')),
    tong_tien     DECIMAL(14,2) NOT NULL DEFAULT 0 CHECK (tong_tien >= 0),
 
    CONSTRAINT FK_Orders_Customers FOREIGN KEY (khach_hang_id)
        REFERENCES CUSTOMERS(id),
 
    -- Bắt buộc có địa chỉ nếu là đơn giao hàng
    CONSTRAINT CHK_Orders_DiaChi
        CHECK (hinh_thuc = N'tu_den' OR dia_chi_giao IS NOT NULL)
);
GO
 
--  Chi tiết đơn hàng
CREATE TABLE ORDER_ITEMS (
    id          INT           IDENTITY(1,1) PRIMARY KEY,
    don_hang_id INT           NOT NULL,
    san_pham_id INT           NOT NULL,
    so_luong    INT           NOT NULL CHECK (so_luong > 0),
    don_gia     DECIMAL(12,2) NOT NULL CHECK (don_gia >= 0),
 
    CONSTRAINT FK_OrderItems_Orders   FOREIGN KEY (don_hang_id)
        REFERENCES ORDERS(id),
    CONSTRAINT FK_OrderItems_Products FOREIGN KEY (san_pham_id)
        REFERENCES PRODUCTS(id),
 
    -- Không cho trùng sản phẩm trong cùng 1 đơn
    CONSTRAINT UQ_OrderItems UNIQUE (don_hang_id, san_pham_id)
);
GO
 
-- Trigger: Tự động trừ tồn kho khi thêm ORDER_ITEM
CREATE TRIGGER trg_ReduceStock
ON ORDER_ITEMS
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
 
    IF EXISTS (
        SELECT 1
        FROM   inserted i
        JOIN   PRODUCTS p ON p.id = i.san_pham_id
        WHERE  p.ton_kho < i.so_luong
    )
    BEGIN
        RAISERROR(N'Không đủ hàng trong kho để thực hiện đơn này.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
 
    UPDATE p
    SET    p.ton_kho = p.ton_kho - i.so_luong
    FROM   PRODUCTS p
    JOIN   inserted i ON i.san_pham_id = p.id;
END;
GO
 
-- Trigger: Tự động cập nhật tong_tien trong ORDERS
CREATE TRIGGER trg_UpdateTongTien
ON ORDER_ITEMS
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
 
    WITH affected AS (
        SELECT don_hang_id FROM inserted
        UNION
        SELECT don_hang_id FROM deleted
    )
    UPDATE o
    SET    o.tong_tien = ISNULL((
               SELECT SUM(oi.so_luong * oi.don_gia)
               FROM   ORDER_ITEMS oi
               WHERE  oi.don_hang_id = o.id
           ), 0)
    FROM   ORDERS o
    JOIN   affected a ON a.don_hang_id = o.id;
END;
GO
 
--  View
 
-- Hàng sắp hết (ton_kho <= nguong_canh_bao)

CREATE VIEW vw_CanhBaoTonKho AS
    SELECT
        p.id,
        p.ten_hang,
        p.ton_kho,
        p.nguong_canh_bao,
        p.don_vi,
        c.ten_loai
    FROM  PRODUCTS   p
    JOIN  CATEGORIES c ON c.id = p.loai_id
    WHERE p.ton_kho <= p.nguong_canh_bao;
GO
 
-- Đơn hàng kèm thông tin khách
CREATE VIEW vw_DonHang AS
    SELECT
        o.id          AS don_hang_id,
        cu.ho_ten,
        cu.so_dien_thoai,
        o.ngay_tao,
        o.hinh_thuc,
        o.gio_nhan,
        o.dia_chi_giao,
        o.trang_thai,
        o.tong_tien
    FROM  ORDERS    o
    JOIN  CUSTOMERS cu ON cu.id = o.khach_hang_id;
GO
 
--  Procedure
 
-- sp_TaoDonHang
--     Tạo 1 đơn hàng hoàn chỉnh trong 1 transaction.
--     Nếu bất kỳ dòng hàng nào lỗi (hết hàng, sai id...)
--     thì toàn bộ đơn bị rollback, không có gì được lưu.
--
--  EXEC sp_TaoDonHang
--     @khach_hang_id = 1,
--     @hinh_thuc     = N'giao_hang',
--     @gio_nhan      = '2025-04-22 09:00',
--     @dia_chi_giao  = N'12 Trần Hưng Đạo, HN',
--     @items         = N'1,5,5000;6,10,4000'
--                        ^ san_pham_id,so_luong,don_gia
--                        ^ phân cách bởi dấu chấm phẩy
-- ------------------------------------------------------------
CREATE OR ALTER PROCEDURE sp_TaoDonHang
    @khach_hang_id INT,
    @hinh_thuc     NVARCHAR(15),
    @gio_nhan      DATETIME      = NULL,
    @dia_chi_giao  NVARCHAR(255) = NULL,
    @items         NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
 
    IF @hinh_thuc = N'giao_hang' AND (@dia_chi_giao IS NULL OR LTRIM(@dia_chi_giao) = '')
    BEGIN
        RAISERROR(N'Đơn giao hàng phải có địa chỉ giao.', 16, 1);
        RETURN;
    END
 
    IF NOT EXISTS (SELECT 1 FROM CUSTOMERS WHERE id = @khach_hang_id)
    BEGIN
        RAISERROR(N'Không tìm thấy khách hàng.', 16, 1);
        RETURN;
    END
 
    DECLARE @don_hang_id INT;
 
    BEGIN TRY
        BEGIN TRANSACTION;
 
        INSERT INTO ORDERS (khach_hang_id, hinh_thuc, gio_nhan, dia_chi_giao, trang_thai)
        VALUES (@khach_hang_id, @hinh_thuc, @gio_nhan, @dia_chi_giao, N'cho');
 
        SET @don_hang_id = SCOPE_IDENTITY();
 
        DECLARE @item      NVARCHAR(100);
        DECLARE @remaining NVARCHAR(MAX) = @items;
        DECLARE @pos       INT;
        DECLARE @sp_id     INT, @sl INT;
        DECLARE @dg        DECIMAL(12,2);
 
        WHILE LEN(@remaining) > 0
        BEGIN
            SET @pos = CHARINDEX(';', @remaining);
 
            IF @pos = 0
            BEGIN
                SET @item      = @remaining;
                SET @remaining = '';
            END
            ELSE
            BEGIN
                SET @item      = LEFT(@remaining, @pos - 1);
                SET @remaining = SUBSTRING(@remaining, @pos + 1, LEN(@remaining));
            END
 
            DECLARE @c1 INT = CHARINDEX(',', @item);
            DECLARE @c2 INT = CHARINDEX(',', @item, @c1 + 1);
 
            SET @sp_id = CAST(LEFT(@item, @c1 - 1)                        AS INT);
            SET @sl    = CAST(SUBSTRING(@item, @c1 + 1, @c2 - @c1 - 1)   AS INT);
            SET @dg    = CAST(SUBSTRING(@item, @c2 + 1, LEN(@item))       AS DECIMAL(12,2));
 
            INSERT INTO ORDER_ITEMS (don_hang_id, san_pham_id, so_luong, don_gia)
            VALUES (@don_hang_id, @sp_id, @sl, @dg);
        END
 
        COMMIT TRANSACTION;
 
        SELECT o.id AS don_hang_id, o.trang_thai, o.tong_tien,
               cu.ho_ten, cu.so_dien_thoai
        FROM   ORDERS    o
        JOIN   CUSTOMERS cu ON cu.id = o.khach_hang_id
        WHERE  o.id = @don_hang_id;
 
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @msg NVARCHAR(500) = ERROR_MESSAGE();
        RAISERROR(@msg, 16, 1);
    END CATCH
END;
GO
 
-- sp_HuyDonHang
--     Hủy đơn + hoàn trả tồn kho trong 1 transaction.
--     Chỉ hủy được đơn đang ở trạng thái 'cho'.
CREATE OR ALTER PROCEDURE sp_HuyDonHang
    @don_hang_id INT
AS
BEGIN
    SET NOCOUNT ON;
 
    DECLARE @trang_thai NVARCHAR(15);
 
    SELECT @trang_thai = trang_thai
    FROM   ORDERS
    WHERE  id = @don_hang_id;
 
    IF @trang_thai IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy đơn hàng.', 16, 1);
        RETURN;
    END
 
    IF @trang_thai <> N'cho'
    BEGIN
        RAISERROR(N'Chỉ có thể hủy đơn đang ở trạng thái "chờ".', 16, 1);
        RETURN;
    END
 
    BEGIN TRY
        BEGIN TRANSACTION;
 
        UPDATE p
        SET    p.ton_kho = p.ton_kho + oi.so_luong
        FROM   PRODUCTS    p
        JOIN   ORDER_ITEMS oi ON oi.san_pham_id = p.id
        WHERE  oi.don_hang_id = @don_hang_id;
 
        UPDATE ORDERS
        SET    trang_thai = N'huy'
        WHERE  id = @don_hang_id;
 
        COMMIT TRANSACTION;
 
        SELECT N'Đã hủy đơn hàng #' + CAST(@don_hang_id AS NVARCHAR)
             + N' và hoàn trả tồn kho thành công.' AS ket_qua;
 
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @msg NVARCHAR(500) = ERROR_MESSAGE();
        RAISERROR(@msg, 16, 1);
    END CATCH
END;
GO
 
-- sp_NhapKho
--     Nhập thêm hàng cho 1 sản phẩm.
CREATE OR ALTER PROCEDURE sp_NhapKho
    @san_pham_id INT,
    @so_luong    INT,
    @ghi_chu     NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
 
    IF @so_luong <= 0
    BEGIN
        RAISERROR(N'Số lượng nhập phải lớn hơn 0.', 16, 1);
        RETURN;
    END
 
    IF NOT EXISTS (SELECT 1 FROM PRODUCTS WHERE id = @san_pham_id)
    BEGIN
        RAISERROR(N'Không tìm thấy sản phẩm.', 16, 1);
        RETURN;
    END
 
    BEGIN TRY
        BEGIN TRANSACTION;
 
        UPDATE PRODUCTS
        SET    ton_kho = ton_kho + @so_luong
        WHERE  id = @san_pham_id;
 
        COMMIT TRANSACTION;
 
        SELECT p.ten_hang,
               p.ton_kho                       AS ton_kho_sau_nhap,
               @so_luong                        AS so_luong_da_nhap,
               ISNULL(@ghi_chu, N'(không có)') AS ghi_chu
        FROM   PRODUCTS p
        WHERE  p.id = @san_pham_id;
 
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @msg NVARCHAR(500) = ERROR_MESSAGE();
        RAISERROR(@msg, 16, 1);
    END CATCH
END;
GO
 
-- sp_CapNhatTrangThaiDon
--     Chuyển trạng thái đơn theo luồng hợp lệ:
--       cho → dang_giao → xong
--     Hủy đơn dùng sp_HuyDonHang riêng (cần hoàn kho).
CREATE OR ALTER PROCEDURE sp_CapNhatTrangThaiDon
    @don_hang_id    INT,
    @trang_thai_moi NVARCHAR(15)
AS
BEGIN
    SET NOCOUNT ON;
 
    DECLARE @hien_tai  NVARCHAR(15);
    DECLARE @hinh_thuc NVARCHAR(15);
 
    SELECT @hien_tai  = trang_thai,
           @hinh_thuc = hinh_thuc
    FROM   ORDERS
    WHERE  id = @don_hang_id;
 
    IF @hien_tai IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy đơn hàng.', 16, 1);
        RETURN;
    END
 
    IF NOT (
        (@hien_tai = N'cho'       AND @trang_thai_moi = N'dang_giao') OR
        (@hien_tai = N'cho'       AND @trang_thai_moi = N'xong'     ) OR
        (@hien_tai = N'dang_giao' AND @trang_thai_moi = N'xong'     )
    )
    BEGIN
        RAISERROR(N'Chuyển trạng thái không hợp lệ: %s → %s',
                  16, 1, @hien_tai, @trang_thai_moi);
        RETURN;
    END
 
    IF @hinh_thuc = N'tu_den' AND @trang_thai_moi = N'dang_giao'
    BEGIN
        RAISERROR(N'Đơn tự đến lấy không có trạng thái "đang giao".', 16, 1);
        RETURN;
    END
 
    BEGIN TRY
        BEGIN TRANSACTION;
 
        UPDATE ORDERS
        SET    trang_thai = @trang_thai_moi
        WHERE  id = @don_hang_id;
 
        COMMIT TRANSACTION;
 
        SELECT N'Đơn #' + CAST(@don_hang_id AS NVARCHAR)
             + N': ' + @hien_tai + N' → ' + @trang_thai_moi AS ket_qua;
 
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @msg NVARCHAR(500) = ERROR_MESSAGE();
        RAISERROR(@msg, 16, 1);
    END CATCH
END;
GO
 
-- Dữ liệu mẫu
 
INSERT INTO CATEGORIES (ten_loai) VALUES
    (N'Đồ uống'),
    (N'Bánh kẹo'),
    (N'Gia vị'),
    (N'Mì - Cháo ăn liền');
 
INSERT INTO PRODUCTS (loai_id, ten_hang, gia, ton_kho, nguong_canh_bao, don_vi) VALUES
    (1, N'Nước suối Lavie 500ml',    5000,  100, 10, N'chai'),
    (1, N'Coca Cola 330ml lon',      12000,  50,  8, N'lon'),
    (2, N'Bánh quy Marie',           18000,  30,  5, N'gói'),
    (2, N'Kẹo dừa Bến Tre',         25000,  20,  5, N'hộp'),
    (3, N'Nước mắm Phú Quốc 500ml', 35000,  15,  3, N'chai'),
    (4, N'Mì Hảo Hảo tôm chua cay',  4000, 200, 20, N'gói');
 
INSERT INTO CUSTOMERS (ho_ten, so_dien_thoai) VALUES
    (N'Nguyễn Văn An',  '0901234567'),
    (N'Trần Thị Bích',  '0912345678'),
    (N'Lê Hoàng Minh',  '0923456789');
 
-- Dùng procedure để tạo đơn (đúng luồng, có transaction)
EXEC sp_TaoDonHang
    @khach_hang_id = 1,
    @hinh_thuc     = N'giao_hang',
    @gio_nhan      = '2025-04-20 09:30:00',
    @dia_chi_giao  = N'12 Trần Hưng Đạo, Hoàn Kiếm, HN',
    @items         = N'1,5,5000;6,10,4000';
 
EXEC sp_TaoDonHang
    @khach_hang_id = 2,
    @hinh_thuc     = N'tu_den',
    @gio_nhan      = '2025-04-20 14:00:00',
    @items         = N'3,2,18000;4,1,25000';
 
EXEC sp_TaoDonHang
    @khach_hang_id = 3,
    @hinh_thuc     = N'giao_hang',
    @gio_nhan      = '2025-04-21 08:00:00',
    @dia_chi_giao  = N'45 Lý Thường Kiệt, Hai Bà Trưng, HN',
    @items         = N'2,3,12000;5,1,35000';
 
GO
 
--  Tình huống: kiểm tra nhanh
 
-- Hàng sắp hết kho
SELECT * FROM vw_CanhBaoTonKho;
 
-- Toàn bộ đơn hàng
SELECT * FROM vw_DonHang;
 
-- Chi tiết đơn #1
SELECT
    oi.don_hang_id,
    p.ten_hang,
    oi.so_luong,
    oi.don_gia,
    oi.so_luong * oi.don_gia AS thanh_tien
FROM  ORDER_ITEMS oi
JOIN  PRODUCTS    p ON p.id = oi.san_pham_id
WHERE oi.don_hang_id = 1;
 
-- Nhập thêm hàng
EXEC sp_NhapKho @san_pham_id = 6, @so_luong = 100, @ghi_chu = N'Nhập thêm từ đại lý';
 
-- Chuyển trạng thái đơn #1
EXEC sp_CapNhatTrangThaiDon @don_hang_id = 1, @trang_thai_moi = N'dang_giao';
EXEC sp_CapNhatTrangThaiDon @don_hang_id = 1, @trang_thai_moi = N'xong';
 
-- Hủy đơn #2
EXEC sp_HuyDonHang @don_hang_id = 2;