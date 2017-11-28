
class RankingModel:
    def __init__(self):
        self.keywords = ["for all smartphones", "for all", "compatible with", "case",\
                "cover", "accessories","battery", "charger", "mount", "bluetooth headset",\
                "headphones", "watch", "smartwatch", "wristband", "compatibile with",\
                "smart watch", "socket holder", "bracket", "holder", "stand"]
        pass

    def process(self, products):
        search_score  = -100000000
        ranking_count = -100000000
        sale_price    = -100000000
        for product in products:
            title = product['title'].lower()
            sc = product['searchScore']
            rc = product['aggregatedRatings']['ratingCount']
            min_sp = product['priceRange'][0]['salePrice']
            sale_price = max(min_sp, sale_price)
            search_score = max(sc, search_score)
            ranking_count = max(rc, ranking_count)
        search_score_normalizer = 0
        ranking_count_normalizer = 0
        sale_price_normalizer = 0
        if search_score > 0:
            search_score_normalizer = (1. * 100)/search_score
        if ranking_count > 0:
            ranking_count_normalizer = (1. * 100)/ranking_count
        if sale_price > 0:
            sale_price_normalizer = (1. * 100)/ sale_price
        print search_score_normalizer, " ", ranking_count_normalizer, " ", sale_price_normalizer
        sorted_products = sorted(products,
                key=lambda k: ((k['searchScore'] * search_score_normalizer) * 0.4) +
                ((k['aggregatedRatings']['ratingCount'] * ranking_count_normalizer) * 0.) +
                ((k['priceRange'][0]['salePrice'] * sale_price_normalizer) * 0.0),
                reverse=True)
        return sorted_products

