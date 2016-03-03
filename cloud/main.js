require('cloud/app.js');

Parse.Cloud.beforeSave("Category", function(request, response) {
  if (!request.object.id) {
    console.log("In");
    var query = new Parse.Query('Category');
    query.descending('order');
    query.first({
      success: function(object) {
        console.log(object);
        request.object.set('order', object.get('order')+1);
        response.success();
      },
      error: function() {
        request.object.set(order, 100);
        response.success();
      }
    });
  } else {
    response.success();
  }
});


Parse.Cloud.beforeSave("Subcategory", function(request, response) {
  console.log(request.object.id);
  if (!request.object.id) {
    var query = new Parse.Query('Subcategory');
    if (request.object.get('category')) {
      query.equalTo('category', request.object.get('category').objectId)
    } else {
      query.equalTo('subcategory', request.object.get('subcategory').objectId)
    }
    query.descending('order');
    query.first({
      success: function(object) {
        console.log(object);
        request.object.set('order', object.get('order')+1);
        response.success();
      },
      error: function() {
        request.object.set(order, 100);
        response.success();
      }
    });
  } else {
    response.success();
  }
});