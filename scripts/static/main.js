var baseUrl = "";
//var baseUrl = "";
var app_key = "tSAOAAgliQChZfKp7xSQ6uJmOtePqiL1";
var ixSearchUrl = "https://api.indix.com/v2.1/search?app_key="+app_key;

function populateProducts (products) {
  $("#products").empty();
  products.forEach(function (product) {
    $("#products").append('<div class="col-4 col-lg-4">'+
      '<img style="height:200px; width: 80px;padding-left: 10px;" src="'+ product.image.url +'"/>'+
      '<p><span style="font-family: Arial; font-size: 16px;">'+ product.title +'</span><br>'+
      '<span style="font-family: Arial; font-size: 11px;">by '+product.brandName+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">category '+product.categoryNamePath+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">storeId: '+product.priceRange[0].storeId+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">searchScore: '+product.searchScore+'<br>'+
      '<span style="font-color: red; font-size: 13px;">from $'+ product.priceRange[0].salePrice+' - '+ product.priceRange[1].salePrice +'</span><br>'+
      'RatingCount '+ product.aggregatedRatings.ratingCount + ' RatingValue '+ product.aggregatedRatings.ratingValue +'</p>'+
      '</div>'
    );
  });
}

function getNormScore(products = [], params={}) {

  let maxPopularityScore = 0
  let maxRelevanceScore = 0
  let maxSalePrice = 0

  for(x of products) {
    const popularityScore = (x.debugScores || {}).popularityScore || 0
    const relevanceScore  = (x.debugScores || {}).relevanceScore || 0
    const salePrice       = (x.debugScores || {}).salePrice || 0
    const searchScore     = (x.debugScores || {}).searchScore || 0
    const brandScore      = (x.debugScores || {}).brandScore || 0
    const brandScoreWeight= (x.debugScores || {}).brandScoreWeight || 0
    maxPopularityScore = Math.max(popularityScore, maxPopularityScore)
    maxRelevanceScore = Math.max(relevanceScore, maxRelevanceScore)
    maxSalePrice = Math.max(salePrice, maxSalePrice)
  }
  return (product) => {
    const searchScore = (product.debugScores || {}).searchScore || 0

    const brandfactor = (searchScore < 30) ? 3 : (searchScore < 50) ? 2 : 1;

    const popularityScore = (product.debugScores || {}).popularityScore || 0
    const relevanceScore  = (product.debugScores || {}).relevanceScore || 0
    const salePrice       = (product.debugScores || {}).salePrice || 0

    const actualRelevanceScore =  relevanceScore - (brandScore*brandScoreWeight) + (brandScore/brandfactor)*brandScoreWeight;

    const norm_pop_score = (maxPopularityScore == 0 ? 0: (100.0)/(maxPopularityScore)) * params.popularityWeight;
    const norm_rel_score = (maxRelevanceScore  == 0 ? 0: (100.0)/(maxRelevanceScore)) * params.relevanceWeight;
    const norm_sale_price = (maxSalePrice == 0 ? 0: (100.0)/(maxSalePrice)) * params.salepriceWeight;

    return parseInt(popularityScore * norm_pop_score + actualRelevanceScore * norm_rel_score + salePrice * norm_sale_price);
  }

}

function populateProductsByType (type, products, params={}) {
  var dom;
  switch (type) {
    case 'api':
      dom = $('#apiProducts'); break;
    case 'gatsbyBP':
      dom = $('#gatsbyBPproducts'); break;
    case 'gatsby':
      dom = $('#gatsbyProducts'); break;
  }
  dom.empty();
  const calcNormScore = getNormScore(products, params)
  for(product of products) {
    dom.append('<div class="col-lg-4">'+
      '<img style="height:200px; width: 80px;padding-left: 10px;" src="'+ product.image.url +'"/>'+
      '<p><span style="font-family: Arial; font-size: 16px;">'+ product.title +'</span><br>'+
      '<span style="font-family: Arial; font-size: 11px;">by '+product.brandName+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">mpid '+product.mpid+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">category '+product.categoryNamePath+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">storeId: '+product.priceRange[0].storeId+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">searchScore: '+product.searchScore+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">normScore: '+calcNormScore(product)+'<br>'+
      '<span style="font-color: red; font-size: 13px;">from $'+ product.priceRange[0].salePrice+' - '+ product.priceRange[1].salePrice +'</span><br>'+
      'RatingCount '+ product.aggregatedRatings.ratingCount + ' RatingValue '+ product.aggregatedRatings.ratingValue +'</p>'+
      '</div>'
    );
  };
}

function populateStatus (query, count, tags) {
  $("#sidebar").empty();
  $("#sidebar").append(
    '<p> Matched '+ count +'<br><br>'+
    'Refined Query:'+ query.replace(/\&/g, '<br>&nbsp;') +
    '</p><br><br>'
  );

  // Dumping the tags from /api/tags
  $('#sidebar').append('<pre>'+
    JSON.stringify(tags) +
    '</pre>'
  );
}


function getProducts(tags, query) {

  var queryStr = '&countryCode=IN&q=' + query;

  $.getJSON(ixSearchUrl + queryStr, null, function (resp) {
    console.log("Actual Search ", resp.result);
    populateProducts(resp.result.products, resp.result.count);
  });

}

function getBrands() {

}

function getStores () {

}

function getCategories() {

}

function getRefinedProducts(tags, query) {

  var queryStr = '&countryCode=IN&pageSize=20';

  if (query)
    queryStr += ("&q=" + query);

  tags.brands.forEach(function (brand) {
    queryStr += brand.matches.map(function (brandId) {
      return "&brandId=" + brandId;
    }).join('');
  });

  tags.stores.forEach(function (store) {
    queryStr += store.matches.map(function (storeId) {
      return "&storeId=" + storeId;
    }).join('');
  });

  tags.categories.forEach(function (categ) {
    queryStr += categ.matches.map(function (categId) {
      return "&categoryId=" + categId;
    }).join('');
  });

  $.getJSON(ixSearchUrl + queryStr, null, function (resp) {
    console.log("products: ", resp);
    populateProducts(resp.result.products, resp.result.count);
    populateStatus(queryStr, resp.result.count, tags);
  });
}

function query () {
  var searchText = $('.btn-search').text();
  $('.btn-search').text('Searching..');

  var q = $("#query").val();
  var sortBy = $('select[name="sort_by"]').val();
  var storeIds = $('#store_id').val();
  var useQas = $('select[name="qas"]').val();

  // weights
  var brand_weight =  $('#brand_weight').val();
  var popularity_weight =  $('#ratings_weight').val();
  var sale_price_weight =  $('#sale_price_weight').val();
  var relevance_weight =  $('#relavance_weight').val();
  var search_weight =  $('#search_weight').val();
  var catconf_weight =  $('#catconf_weight').val();

  if (!q) {
      alert("Please enter valid search term!!!");
      $('.btn-search').text('Search');
      return;
  }

  var params = {
    q: q,
    sort_by: sortBy,
    store_ids: storeIds.join(','),
    relevanceParams: JSON.stringify({
    useRankScore: true,
    brandScoreWeight: brand_weight,
    popularityWeight: popularity_weight,
    salepriceWeight: sale_price_weight,
    relevanceWeight: relevance_weight,
    catConfScoreWeight: 0.0,
    searchScoreWeight: 1.0
    }),
    qas: useQas
  };
  const paramsObj = JSON.parse(params.relevanceParams);

  $.getJSON(baseUrl+"/api/products", params,
    function (resp) {
      $('.btn-search').text(searchText);
      populateProductsByType('api', resp.api.products, paramsObj)
      populateProductsByType('gatsby', resp.gatsby.products, paramsObj)
      populateProductsByType('gatsbyBP', resp.gatsbyBP.products, paramsObj)
   })
}

$("#query").on('keyup', function (e) {
    if (e.keyCode == 13) {
        query();
    }
});
