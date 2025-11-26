import django_filters
from django.db.models import Q
from .models import Product, Category, Brand

class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method='filter_category')
    brand = django_filters.CharFilter(field_name='brand__slug') # Lọc theo brand slug
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    search = django_filters.CharFilter(method='filter_search')
    
    class Meta:
        model = Product
        fields = ['condition', 'seller', 'is_sold', 'brand']

    def filter_category(self, queryset, name, value):
        try:
            category = Category.objects.get(slug=value)
            if category.children.exists():
                descendants = category.children.all()
                return queryset.filter(category__in=[category] + list(descendants))
            else:
                return queryset.filter(category=category)
        except Category.DoesNotExist:
            return queryset.none()

    def filter_search(self, queryset, name, value):
        if not value:
            return queryset
        
        # Split search terms to allow "iphone 13" to match "iPhone 13 Pro"
        # Logic: Each word must appear in at least one of the fields (AND logic between words)
        # But commonly, users want "term1" AND "term2" across the document.
        # Simple implementation: The whole phrase must be in one of the fields OR split words.
        
        # Let's support multi-word search where EACH word must match at least one field.
        # e.g. "blue iphone" -> (title has blue OR desc has blue) AND (title has iphone OR desc has iphone)
        
        words = value.split()
        for word in words:
            queryset = queryset.filter(
                Q(title__icontains=word) | 
                Q(description__icontains=word) |
                Q(brand__name__icontains=word) |
                Q(category__name__icontains=word)
            )
        return queryset
