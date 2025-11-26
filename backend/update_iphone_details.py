import os
import django
import random

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from Products.models import Product, ProductImage

def update_iphone():
    # Tìm sản phẩm iPhone 13 Pro Max 256GB
    try:
        product = Product.objects.get(title__icontains="iPhone 13 Pro Max 256GB")
        print(f"Found product: {product.title} (ID: {product.id})")
    except Product.DoesNotExist:
        print("Product not found! Please create it first.")
        return

    # 1. Update Specifications (JSON)
    specs = {
        "Màn hình (Screen)": "6.7 inch Super Retina XDR OLED, 120Hz",
        "Chip (CPU)": "Apple A15 Bionic (5nm)",
        "RAM": "6GB",
        "Bộ nhớ trong (ROM)": "256GB",
        "Camera sau": "12MP (Wide) + 12MP (Telephoto) + 12MP (Ultrawide) + LiDAR",
        "Camera trước": "12MP TrueDepth",
        "Pin (Battery)": "4352 mAh, Hỗ trợ sạc nhanh 27W",
        "Tình trạng pin": "90%",
        "Hệ điều hành": "iOS 17",
        "SIM": "1 Nano SIM + 1 eSIM",
        "Màu sắc": "Sierra Blue (Xanh dương nhạt)"
    }
    product.specifications = specs

    # 2. Update Condition Detail
    product.condition_detail = """
    - Ngoại hình: Like New 98%, rất đẹp.
    - Màn hình: Không trầy xước, đã dán cường lực từ lúc mua.
    - Thân máy: Có 1 vết xước nhỏ tí xíu ở cạnh dưới gần cổng sạc (nhìn kỹ mới thấy).
    - Chức năng: Mọi chức năng hoạt động hoàn hảo (FaceID nhạy, loa to, sóng khỏe).
    - Sửa chữa: Máy nguyên zin, chưa từng tháo mở hay sửa chữa.
    - Phụ kiện: Hộp trùng IMEI, cáp sạc zin theo máy (chưa dùng).
    """

    # 3. Update Description (Optional refinement)
    product.description = """
    Bán iPhone 13 Pro Max 256GB màu Sierra Blue cực đẹp.
    Máy quốc tế Nhật (J/A), âm chụp ảnh tắt được.
    Dùng rất giữ gìn, pin còn trâu (90%).
    Phù hợp cho ai cần máy màn hình lớn, pin trâu, camera quay phim chụp ảnh đỉnh cao.
    Bao test 7 ngày, lỗi hoàn tiền ngay lập tức.
    """

    product.save()
    print("Updated product details (specs, condition, description).")

    # 4. Add Detailed Images
    # Xóa ảnh cũ (nếu muốn làm mới hoàn toàn)
    # product.images.all().delete()
    
    # Danh sách ảnh demo (Placeholder)
    # Trong thực tế, đây sẽ là URL từ Supabase/S3 của bạn
    images = [
        "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&q=80&w=800", # Back & Front
        "https://images.unsplash.com/photo-1690310738440-276686a63520?auto=format&fit=crop&q=80&w=800", # Camera closeup
        "https://images.unsplash.com/photo-1663499477884-69979d71c183?auto=format&fit=crop&q=80&w=800", # Side view
        "https://images.unsplash.com/photo-1678911820864-e2c567c655d7?auto=format&fit=crop&q=80&w=800", # Hand holding
        "https://images.unsplash.com/photo-1512054502232-10a0a035d672?auto=format&fit=crop&q=80&w=800", # Box/Accessories demo
    ]

    # Cập nhật ảnh đại diện (Ảnh đầu tiên)
    product.image = images[0]
    product.save()

    # Thêm các ảnh còn lại vào ProductImage
    # Xóa ảnh phụ cũ để tránh trùng lặp khi chạy lại script
    product.images.all().delete()
    
    for url in images[1:]:
        ProductImage.objects.create(product=product, image=url)
    
    print(f"Added {len(images)} images to product.")

if __name__ == '__main__':
    update_iphone()

