var baseUrl = "";
//var baseUrl = "";
var app_key = "tSAOAAgliQChZfKp7xSQ6uJmOtePqiL1";
var ixSearchUrl = "https://api.indix.com/v2.1/search?app_key="+app_key;

function populateProducts (products) {
  $("#products").empty();
  products.forEach(function (product) {
    $("#products").append('<div class="col-6 col-lg-4">'+
      '<img style="height:200px; width: 160px;padding-left: 10px;" src="'+ product.image.url +'"/>'+
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

function populateProductsByType (type, products) {
  var dom;
  switch (type) {
    case 'api':
      dom = $('#apiProducts'); break;
    case 'gatsby':
      dom = $('#gatsbyProducts'); break;
  }
  dom.empty();
  products.forEach(function (product) {
    dom.append('<div class="col-lg-4">'+
      '<img style="height:200px; width: 160px;padding-left: 10px;" src="'+ product.image.url +'"/>'+
      '<p><span style="font-family: Arial; font-size: 16px;">'+ product.title +'</span><br>'+
      '<span style="font-family: Arial; font-size: 11px;">by '+product.brandName+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">mpid '+product.mpid+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">category '+product.categoryNamePath+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">storeId: '+product.priceRange[0].storeId+'<br>'+
      '<span style="font-family: Arial; font-size: 11px;">searchScore: '+product.searchScore+'<br>'+
      '<span style="font-color: red; font-size: 13px;">from $'+ product.priceRange[0].salePrice+' - '+ product.priceRange[1].salePrice +'</span><br>'+
      'RatingCount '+ product.aggregatedRatings.ratingCount + ' RatingValue '+ product.aggregatedRatings.ratingValue +'</p>'+
      '</div>'
    );
  });
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

  if (!q) {
      alert("Please enter valid search term!!!");
      $('.btn-search').text('Search');
      return;
  }
  var params = {
    q: q,
    sort_by: sortBy,
    store_ids: storeIds.join(','),
    qas: useQas
  };
  console.log(params);

  $.getJSON(baseUrl+"/api/products", params,
    function (resp) {
      $('.btn-search').text(searchText);
      populateProductsByType('api', resp.api.products)
      populateProductsByType('gatsby', resp.gatsby.products)
   })
}

$("#query").on('keyup', function (e) {
    if (e.keyCode == 13) {
        query();
    }
});
