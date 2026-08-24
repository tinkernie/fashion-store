import pytest
from search.services import SearchService
from products.tests.factories import ProductFactory
from categories.tests.factories import CategoryFactory
from store_collections.tests.factories import CollectionFactory
from variants.tests.factories import VariantFactory
from product_options.tests.factories import ProductOptionFactory, OptionValueFactory


@pytest.mark.django_db
class TestSearchService:
    def test_search_by_title(self):
        p1 = ProductFactory(title='Silk Dress', status='published')
        p2 = ProductFactory(title='Wool Coat', status='published')
        service = SearchService()
        result = service.search(query='silk')
        assert len(result['products']) == 1
        assert result['products'][0]['title'] == 'Silk Dress'

    def test_filter_by_category(self):
        cat = CategoryFactory(slug='dresses')
        p = ProductFactory(category=cat, status='published')
        ProductFactory(status='published')  # not in cat
        service = SearchService()
        result = service.search(filters={'category_slug': 'dresses'})
        assert len(result['products']) == 1

    def test_filter_by_price_range(self):
        product = ProductFactory(title='Cheap', status='published')
        VariantFactory(product=product, price=50, status='published')
        product2 = ProductFactory(title='Expensive', status='published')
        VariantFactory(product=product2, price=200, status='published')
        service = SearchService()
        result = service.search(filters={'min_price': 100, 'max_price': 300})
        assert len(result['products']) == 1
        assert result['products'][0]['title'] == 'Expensive'

    def test_filter_by_options(self):
        product = ProductFactory(title='T-Shirt', status='published')
        option = ProductOptionFactory(product=product, name='Color')
        value = OptionValueFactory(option=option, value='Red')
        variant = VariantFactory(product=product, status='published',
                                 option_values=[{'option': option, 'value': value}])
        service = SearchService()
        filters = {'options': {'Color': ['Red']}}
        result = service.search(filters=filters)
        assert len(result['products']) == 1
        assert result['products'][0]['title'] == 'T-Shirt'

    def test_dynamic_filters_generation(self):
        cat = CategoryFactory(name='Women', slug='women')
        product = ProductFactory(category=cat, status='published')
        variant = VariantFactory(product=product, price=100, status='published')
        service = SearchService()
        result = service.search(filters={'category_slug': 'women'})
        filters = result['filters']
        assert len(filters['categories']) == 1
        assert filters['categories'][0]['slug'] == 'women'
        # Price range should reflect product
        assert filters['price_range']['min'] == '100.00'
        assert filters['price_range']['max'] == '100.00'
