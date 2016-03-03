(function() {
    var app = angular.module('La20AdminApp', ['ngAnimate', 'ui.router', 'anim-in-out','ui.tinymce','angularjs-dropdown-multiselect']).config(function($sceProvider) {
        $sceProvider.enabled(false);
    });

    app.config(function($stateProvider, $urlRouterProvider) {
      
        $urlRouterProvider.otherwise("/banners");
      
        $stateProvider
        .state('banners', {
            url: "/banners",
            templateUrl: "views/banners.html?i="+Math.random(),
			controller: function($scope, $state, $rootScope, $log) {
				
				$rootScope.activeCategory = 'banners';
				$scope.parentCategories = [];
				$scope.currentBanner = null;
				$scope.cloneBanner = null;
                var changed = false;
                
                var listener = function() {};
                var listenerParentCat = function() {};
				
                $scope.addBanner = function() {
                    if (!changed) {
                        listener();
                        listenerParentCat();
                        changed = false;
                        $('#editImage').replaceWith($('#editImage').clone(true));
                        
                        $scope.currentBanner = new Parse.Object("Banner");
                        $scope.cloneBanner = $scope.currentBanner.clone();
                        $scope.parentCategories = [];
                        
                        listener = $scope.$watch('currentBanner.attributes', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                        listenerParentCat = $scope.$watch('parentCategories', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                    } else {
                        if (confirm("Hay cambios sin guardar\n ¿Dese continuar?")) {
                            $scope.undo();
                            changed = false;
                            $scope.addBanner();
                        }
                    }
				}
				
				$scope.editBanner = function(index) {
                    if (!changed) {
                        listener();
                        listenerParentCat();
                        changed = false;
                        $('#editImage').replaceWith($('#editImage').clone(true));
                        
                        $scope.currentBanner = $scope.banners[index];
                        $scope.cloneBanner = $scope.currentBanner.clone();
                        
                        $scope.parentCategories = [];
                        
                        angular.forEach($scope.currentBanner.get('categories'), function(category) {
                            $scope.parentCategories.push({'id':category.id});
                        });
                        
                        listener = $scope.$watch('currentBanner.attributes', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                        listenerParentCat = $scope.$watch('parentCategories', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                    } else {
                        if (confirm("Hay cambios sin guardar\n ¿Dese continuar?")) {
                            $scope.undo();
                            changed = false;
                            $scope.editBanner(index);
                        }
                    }
				}
                
                $scope.undo = function() {
                    for(param in $scope.currentBanner) {
                        if (param!="id") {
                            $scope.currentBanner[param] = $scope.cloneBanner[param];
                        }
                    }
                }
				
				$scope.fileNameChanged = function() {
					input = $('#editImage')[0];
					if (input.files && input.files[0]) {
					var reader = new FileReader();
					reader.onload = function (e) {
						$('#imageEdit').attr('src', e.target.result);
					};
					reader.readAsDataURL(input.files[0]);
				  }
				}
				
				$scope.saveBanner = function(btn) {
					$scope.isSaving = true;
					var banner = $scope.currentBanner;
                    for (var prop in banner.attributes) {
                        banner.set(prop, banner.attributes[prop])
                    }
                    var arr = [];
                    angular.forEach($scope.parentCategories, function(item) {
                        arr.push({"__type":"Pointer","className":"Category","objectId":item.id});
                    })
                    banner.set('categories',arr);
					if ($('#editImage')[0].files[0]) {
						var file = $('#editImage')[0].files[0];
						var name = file.name;
						var parseFile = new Parse.File(name, file);
						parseFile.save({
							success: function(object) {
								banner.set('image', parseFile);
								$scope.saveInfo(banner);
							},
							error: function(object, error) {
								$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando el banner "'+banner.get('description')+'"');
								$scope.$apply(function() {
									$scope.isSaving = false;
								});
							}
						});
					}
					else {
						$scope.saveInfo(banner);
					}
				}
                
                $scope.deleteBanner = function() {
                    var banner = $scope.currentBanner;
                    if (confirm("Seguro desea eliminar el banner \""+banner.get('description')+"\"?") ){
                        banner.destroy({
                            success: function(object) {
                                for(var i=0,len=$scope.banners.length;i<len;i++) {
                                    if ($scope.banners[i].id==object.id) {
                                        $scope.$apply(function() {
                                            $scope.banners.splice(i,1);
                                        });
                                        $rootScope.addAlert($('#categories .alerts'), 'success', 'Banner "'+banner.get('description')+'" eliminado');
                                        $scope.$apply(function() {
                                            listener();
                                            changed = false;
                                            $scope.currentBanner = null;
                                        })
                                        break;
                                    }
                                }
                            },
                            error: function() {
                                $rootScope.addAlert($('#categories .alerts'), 'danger', 'Error eliminando el banner "'+banner.get('description')+'"');
                            }
                        })
                    }
                }
				
				$scope.saveInfo = function(banner) {
					try {
						banner.save(null, {
							success: function(object) {
                                var mensaje = object._existed? "actualizado": "creado";
                                $rootScope.addAlert($('#categories .alerts'), 'success', 'Banner "'+banner.get('description')+'" '+mensaje);
                                listener();
                                changed = false;
								$scope.$apply(function() {
                                    $scope.currentBanner = null;
									$scope.isSaving = false;
                                    if (!object._existed) {
                                        $scope.banners.push(object);
                                    }
								});
							},
							error: function(object, error) {
								$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando el banner "'+banner.get('description')+'"');
								$scope.$apply(function() {
									$scope.isSaving = false;
								});
							}
						});
					}catch(e) {
						$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando el banner "'+banner.get('description')+'"');
						$scope.$apply(function() {
							$scope.isSaving = false;
						});
					}
				}
				$rootScope.loadBanners($scope);
                $rootScope.loadCategories($scope);
				
                $scope.sortBanners = function() {
                    $('#sortable').children().each(function(index, element) {
                        if ($(this).data('order')!=index+1) {
                            var banner = $scope.banners[$(this).data('index')];
                            banner.set('order', index+1);
                            $(this).data('order', index+1);
                            banner.save(null, {
                                success: function(object) {
                                    $rootScope.addAlert($('#categories .alerts'), 'success', 'Banner "'+banner.get('description')+'" actualizado');
                                },
                                error: function(object, error) {
                                    $rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando el banner "'+banner.get('description')+'"');
                                }
                            });
                        }
                    });
                }
                $( "#sortable" ).sortable({
					stop: function( event, ui ) {
						$scope.sortBanners();
					}
				});
				$( "#sortable" ).disableSelection();
			}
        })
        .state('categories', {
            url: "/categories",
            templateUrl: "views/categories.html?i="+Math.random(),
			controller: function($scope, $state, $rootScope, $log) {
				
				$rootScope.activeCategory = 'categories';
				
				$scope.currentCategory = null;
				$scope.cloneCategory = null;
                var changed = false;
                
                var listener = function() {};
				
                $scope.addCategory = function() {
                    if (!changed) {
                        listener();
                        changed = false;
                        $('#editImage').replaceWith($('#editImage').clone(true));
                        
                        $scope.currentCategory = new Parse.Object("Category");
                        $scope.cloneCategory = $scope.currentCategory.clone();
                        
                        listener = $scope.$watch('currentCategory.attributes', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                    } else {
                        if (confirm("Hay cambios sin guardar\n ¿Dese continuar?")) {
                            $scope.undo();
                            changed = false;
                            $scope.addCategory();
                        }
                    }
				}
				
				$scope.editCategory = function(index) {
                    if (!changed) {
                        listener();
                        changed = false;
                        $('#editImage').replaceWith($('#editImage').clone(true));
                        
                        $scope.currentCategory = $scope.categories[index];
                        $scope.cloneCategory = $scope.currentCategory.clone();
                        
                        listener = $scope.$watch('currentCategory.attributes', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                        
                    } else {
                        if (confirm("Hay cambios sin guardar\n ¿Dese continuar?")) {
                            $scope.undo();
                            changed = false;
                            $scope.editCategory(index);
                        }
                    }
				}
                
                $scope.undo = function() {
                    for(param in $scope.currentCategory) {
                        if (param!="id") {
                            $scope.currentCategory[param] = $scope.cloneCategory[param];
                        }
                    }
                }
				
				$scope.fileNameChanged = function() {
					input = $('#editImage')[0];
					if (input.files && input.files[0]) {
					var reader = new FileReader();
					reader.onload = function (e) {
						$('#imageEdit').attr('src', e.target.result);
					};
					reader.readAsDataURL(input.files[0]);
				  }
				}
				
				$scope.saveCategory = function(btn) {
					$scope.isSaving = true;
					var category = $scope.currentCategory;
                    for (var prop in category.attributes) {
                        category.set(prop, category.attributes[prop])
                    }
					if ($('#editImage')[0].files[0]) {
						var file = $('#editImage')[0].files[0];
						var name = file.name;
						var parseFile = new Parse.File(name, file);
						parseFile.save(
                        {
							success: function(object) 
                            {
								category.set('image', parseFile);
								$scope.saveInfo(category);
							},
							error: function(object, error) {
								$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando la categoría "'+category.get('name')+'"');
								$scope.$apply(function() {
									$scope.isSaving = false;
								});
							}
						});
					}
					else {
						$scope.saveInfo(category);
					}
				}
                
                $scope.deleteCategory = function() {
                    var category = $scope.currentCategory;
                    if (confirm("Seguro desea eliminar la categoría \""+category.get('name')+"\"?") ){
                        category.destroy({
                            success: function(object) {
                                for(var i=0,len=$scope.categories.length;i<len;i++) {
                                    if ($scope.categories[i].id==object.id) {
                                        $scope.$apply(function() {
                                            $scope.categories.splice(i,1);
                                        });
                                        $rootScope.addAlert($('#categories .alerts'), 'success', 'Categoría "'+category.get('name')+'" eliminada');
                                        $scope.$apply(function() {
                                            listener();
                                            changed = false;
                                            $scope.currentCategory = null;
                                        })
                                        break;
                                    }
                                }
                            },
                            error: function() {
                                $rootScope.addAlert($('#categories .alerts'), 'danger', 'Error eliminando la categoría "'+category.get('name')+'"');
                            }
                        })
                    }
                }
				
				$scope.saveInfo = function(category) {
					try {
						category.save(null, {
							success: function(object) {
                                var mensaje = object._existed? "actualizada": "creada";
                                $rootScope.addAlert($('#categories .alerts'), 'success', 'Categoría "'+category.get('name')+'" '+mensaje);
                                listener();
                                changed = false;
								$scope.$apply(function() {
                                    $scope.currentCategory = null;
									$scope.isSaving = false;
                                    if (!object._existed) {
                                        $scope.categories.push(object);
                                    }
								});
							},
							error: function(object, error) {
								$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando la categoría "'+category.get('name')+'"');
								$scope.$apply(function() {
									$scope.isSaving = false;
								});
							}
						});
					}catch(e) {
						$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando la categoría "'+category.get('name')+'"');
						$scope.$apply(function() {
							$scope.isSaving = false;
						});
					}
				}
				$rootScope.loadCategories($scope);
				
                $scope.sortCategories = function() {
                    $('#sortable').children().each(function(index, element) {
                        if ($(this).data('order')!=index+1) {
                            var category = $scope.categories[$(this).data('index')];
                            category.set('order', index+1);
                            $(this).data('order', index+1);
                            category.save(null, {
                                success: function(object) {
                                    $rootScope.addAlert($('#categories .alerts'), 'success', 'Categoría "'+category.get('name')+'" actualizada');
                                },
                                error: function(object, error) {
                                    $rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando la categoría "'+category.get('name')+'"');
                                }
                            });
                        }
                    });
                }
                $( "#sortable" ).sortable({
					stop: function( event, ui ) {
						$scope.sortCategories();
					}
				});
				$( "#sortable" ).disableSelection();
			}
        })
		.state('subcategories', {
			url: '/subcategories',
            templateUrl: "views/subcategories.html?i="+Math.random(),
			controller: function($scope, $state, $rootScope, $log,$filter) {
				
				$rootScope.activeCategory = 'subcategories';
				
				$scope.currentSubcategory = null;
                $scope.cloneSubcategory = null;
                
                $scope.parentCategory = "";
                $scope.parentSubcategory = "";
                
                
                var changed = false;
                
                var listener = function() {};
                var listenerParent = function(){}
                var listenerParentSub = function() {}
                
                $scope.addSubcategory = function() {
                    if (!changed) {
                        listener();
                        listenerParent();
                        listenerParentSub();
                        changed = false;
                        $('#editImage').replaceWith($('#editImage').clone(true));
                        $scope.currentSubcategory = new Parse.Object("Subcategory");
                        //$scope.currentCategory.attributes.image = {"_url": "img/blank.gif"};
                        $scope.cloneSubcategory = $scope.currentSubcategory.clone();
                        
                        $scope.parentCategory = "";
                        $scope.parentSubcategory = "";
                        
                        listener = $scope.$watch('currentSubcategory.attributes', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                        
                        listenerParent = $scope.$watch('parentCategory', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                var category = new Parse.Object('Category');
                                category.id = newvalue;
                                $scope.currentSubcategory.set('category', category);
                            }
                        },true);
                        
                        listenerParentSub = $scope.$watch('parentSubcategory', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                var subcategory = new Parse.Object('Subcategory');
                                subcategory.id = newvalue;
                                $scope.currentSubcategory.set('subcategory', subcategory);
                            }
                        },true);
                        
                    } else {
                        if (confirm("Hay cambios sin guardar\n ¿Dese continuar?")) {
                            $scope.undo();
                            changed = false;
                            $scope.addSubcategory();
                        }
                    }
				}
				
				$scope.editSubcategory = function(index) {
                    if (!changed) {
                        listener();
                        listenerParent();
                        listenerParentSub();
                        
                        changed = false;
                        $('#editImage').replaceWith($('#editImage').clone(true));
                        
                        $scope.currentSubcategory = $filter('searchValue')($scope.subcategories,$scope.searchTerm)[index];
                        $scope.cloneSubcategory = $scope.currentSubcategory.clone();
                        
                        $scope.parentCategory = ($scope.currentSubcategory.attributes.category)? $scope.currentSubcategory.attributes.category.id: "";
                        //$scope.parentSubcategory = ($scope.currentSubcategory.attributes.subcategory)? $scope.currentSubcategory.attributes.subcategory.id: "";
                        
                        listener = $scope.$watch('currentSubcategory.attributes', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                        
                        listenerParent = $scope.$watch('parentCategory', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                var category = new Parse.Object('Category');
                                category.id = newvalue;
                                $scope.currentSubcategory.set('category', category);
                            }
                        },true);
                        
                        listenerParentSub = $scope.$watch('parentSubcategory', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                var subcategory = new Parse.Object('Subcategory');
                                subcategory.id = newvalue;
                                $scope.currentSubcategory.set('subcategory', subcategory);
                            }
                        },true);
                    } else {
                        if (confirm("Hay cambios sin guardar\n ¿Dese continuar?")) {
                            $scope.undo();
                            changed = false;
                            $scope.editSubcategory(index);
                        }
                    }
				}
                
                $scope.undo = function() {
                    for(param in $scope.currentSubcategory) {
                        if (param!="id") {
                            $scope.currentSubcategory[param] = $scope.cloneSubcategory[param];
                        }
                    }
                }
				
				$scope.fileNameChanged = function() {
					input = $('#editImage')[0];
					if (input.files && input.files[0]) {
					var reader = new FileReader();
					reader.onload = function (e) {
						$('#imageEdit').attr('src', e.target.result);
					};
					reader.readAsDataURL(input.files[0]);
				  }
				}
				
				$scope.saveSubcategory = function(btn) {
					$scope.isSaving = true;
					var subcategory = $scope.currentSubcategory;
                    for (var prop in subcategory.attributes) {
                        subcategory.set(prop, subcategory.attributes[prop])
                    }
					if ($('#editImage')[0].files[0]) {
						var file = $('#editImage')[0].files[0];
						var name = file.name;
						var parseFile = new Parse.File(name, file);
						parseFile.save({
							success: function(object) {
								subcategory.set('image', parseFile);
								$scope.saveInfo(subcategory);
							},
							error: function(object, error) {
								$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando la subcategoría "'+subcategory.get('name')+'"');
								$scope.$apply(function() {
                                    $scope.isSaving = false;
								});
							}
						});
					}
					else {
						$scope.saveInfo(subcategory);
					}
				}
                
                $scope.deleteSubcategory = function() {
                    var subcategory = $scope.currentSubcategory;
                    if (confirm("Seguro desea eliminar la subcategoría \""+subcategory.get('name')+"\"?") ){
                        subcategory.destroy({
                            success: function(object) {
                                for(var i=0,len=$scope.subcategories.length;i<len;i++) {
                                    if ($scope.subcategories[i].id==object.id) {
                                        $scope.$apply(function() {
                                            $scope.subcategories.splice(i,1);
                                        });
                                        $rootScope.addAlert($('#categories .alerts'), 'success', 'Subcategoría "'+subcategory.get('name')+'" eliminada');
                                        $scope.$apply(function() {
                                            listener();
                                            listenerParent();
                                            listenerParentSub();
                                            changed = false;
                                            $scope.currentSubcategory = null;    
                                        })
                                        break;
                                    }
                                }
                            },
                            error: function() {
                                $rootScope.addAlert($('#categories .alerts'), 'danger', 'Error eliminando la subcategoría "'+subcategory.get('name')+'"');
                            }
                        })
                    }
                }
				
				$scope.saveInfo = function(subcategory) {
					try {
						subcategory.save(null, {
							success: function(object) {
                                var mensaje = object._existed? "actualizada": "creada";
                                $rootScope.addAlert($('#categories .alerts'), 'success', 'Subcategoría "'+subcategory.get('name')+'" '+mensaje);
                                listener();
                                changed = false;
								$scope.$apply(function() {
                                    $scope.currentSubcategory = null;
									$scope.isSaving = false;
                                    if (!object._existed) {
                                        $scope.subcategories.push(object);
                                    }
								});
							},
							error: function(object, error) {
								$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando la subcategoría "'+subcategory.get('name')+'"');
								$scope.$apply(function() {
									$scope.isSaving = false;
								});
							}
						});
					}catch(e) {
						$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando la subcategoría "'+subcategory.get('name')+'"');
						$scope.$apply(function() {
							$scope.isSaving = false;
						});
					}
				}
				$rootScope.loadSubcategories($scope);
                $rootScope.loadCategories($scope);
			}
		})
        .state('subcategories_order', {
			url: '/subcategories/order',
            templateUrl: "views/subcategories_order.html?i="+Math.random(),
			controller: function($scope, $state, $rootScope, $log, $filter) {
				
				$rootScope.activeCategory = 'subcategories_order';
				
				$scope.currentSubcategory = null;
                $scope.cloneSubcategory = null;
                
                $scope.parentCategory = "";
                $scope.parentSubcategory = "";
                
                $rootScope.loadSubcategories($scope);
                $rootScope.loadCategories($scope);
                
                $scope.orderCategory = function($index) {
                    $scope.currentCategory = $scope.categories[$index];
                    $log.info($scope.currentCategory);
                }
                
                $scope.orderSubcategory = function($index) {
                    $scope.currentCategory = $filter('specialSubcategories')($scope.subcategories)[$index];
                }
                
                $scope.sortCategories = function() {
                    var filtered_subcategories = $filter('forCategory')($scope.subcategories, $scope.currentCategory);
                    $('#sortable_sub').children().each(function(index, element) {
                        if ($(this).data('order')!=index+1) {
                            var subcategory = filtered_subcategories[$(this).data('index')];
                            subcategory.set('order', index+1);
                            $(this).data('order', index+1);
                            subcategory.save(null, {
                                success: function(object) {
                                    $rootScope.addAlert($('#categories .alerts'), 'success', 'Subategoría "'+object.get('name')+'" actualizada');
                                },
                                error: function(object, error) {
                                    $rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando la subcategoría "'+object.get('name')+'"');
                                }
                            });
                        }
                    });
                }
                $( "#sortable_sub" ).sortable({
					stop: function( event, ui ) {
						$scope.sortCategories();
					}
				});
				$( "#sortable_sub" ).disableSelection();
			}
		})
		.state('items', {
            url: "/items",
            templateUrl: "views/items.html?i="+Math.random(),
			controller: function($scope, $state, $rootScope, $log,$filter) {
                $scope.subcategories = [];
                $scope.parentSubcategories = [];
                $rootScope.activeCategory = 'items';
                var listener = function(){};
                var listenerParent = function(){};
                var listenerParentSub = function(){};
                var changed = false;
                
                $scope.addDetail = function($index) {
                    $scope.currentItem.attributes.description += '<img class="icono" src="'+$scope.details[$index].attributes.image._url+'" /> [Descripcion]';
                }
                
                $scope.tinyMCEOptions = {
                    menubar: false,
                    content_css : "css/tinymce.css",
                    height: 400
                }
                $scope.addItem = function() {
                    if (!changed) {
                        listener();
                        listenerParentSub();
                        changed = false;
                        $('#editImage').replaceWith($('#editImage').clone(true));
                        $scope.currentItem = new Parse.Object("Item");
                        $scope.currentItem.attributes.name = "";
                        //$scope.currentCategory.attributes.image = {"_url": "img/blank.gif"};
                        $scope.cloneItem = $scope.currentItem.clone();
                        $scope.parentSubcategories = [];
                        $scope.notSpecialSubcategories = $filter('notSpecialSubcategories')($scope.subcategories);
                        
                        listener = $scope.$watch('currentItem.attributes', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                        listenerParentSub = $scope.$watch('parentSubcategories', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                    } else {
                        if (confirm("Hay cambios sin guardar\n ¿Dese continuar?")) {
                            $scope.undo();
                            changed = false;
                            $scope.addItem();
                        }
                    }
				}
                
                $scope.editItem = function(index) {
                    if (!changed) {
                        listener();
                        listenerParent();
                        listenerParentSub();
                        $scope.subcategories = $scope.subcategories
                        changed = false;
                        $('#editImage').replaceWith($('#editImage').clone(true));
                        
                        $scope.currentItem = $filter('searchValue')($scope.items,$scope.searchTerm)[index];
                        $scope.cloneItem = $scope.currentItem.clone();
                        $scope.notSpecialSubcategories = [];
                        $scope.notSpecialSubcategories = $filter('notSpecialSubcategories')($scope.subcategories);
                        
                        $scope.parentSubcategories = [];
                        
                        angular.forEach($scope.currentItem.get('subcategories'), function(subcategory) {
                            $scope.parentSubcategories.push({'id':subcategory.id});
                        });
                        
                        listener = $scope.$watch('currentItem.attributes', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                        
                        listenerParentSub = $scope.$watch('parentSubcategories', function(newvalue, oldvalue) {
                            $log.info("Cambio");
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                        
                    } else {
                        if (confirm("Hay cambios sin guardar\n ¿Dese continuar?")) {
                            $scope.undo();
                            changed = false;
                            $scope.editItem(index);
                        }
                    }
				}
                
                $scope.undo = function() {
                    for(param in $scope.currentItem) {
                        if (param!="id") {
                            $scope.currentItem[param] = $scope.cloneItem[param];
                        }
                    }
                }
                
                $scope.fileNameChanged = function() {
					input = $('#editImage')[0];
					if (input.files && input.files[0]) {
					var reader = new FileReader();
					reader.onload = function (e) {
						$('#imageEdit').attr('src', e.target.result);
					};
					reader.readAsDataURL(input.files[0]);
				  }
				}
                
                $scope.saveItem = function(btn) {
					$scope.isSaving = true;
					var item = $scope.currentItem;
                    
                    for (var prop in item.attributes) {
                        item.set(prop, item.attributes[prop])
                    }
                    var arr = [];
                    angular.forEach($scope.parentSubcategories, function(item) {
                        var category = new Parse.Object('Subcategory');
                        category.id = item.id
                        arr.push({"__type":"Pointer","className":"Subcategory","objectId":item.id});
                    })
                    
                    item.set('subcategories',arr);
					
                    if ($('#editImage')[0].files[0]) {
						var file = $('#editImage')[0].files[0];
						var name = file.name;
						var parseFile = new Parse.File(name, file);
						parseFile.save({
							success: function(object) {
								item.set('image', parseFile);
								$scope.saveInfo(item);
							},
							error: function(object, error) {
								$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando el item "'+item.get('name')+'"');
								$scope.$apply(function() {
                                    $scope.isSaving = false;
								});
							}
						});
					}
					else {
						$scope.saveInfo(item);
					}
				}
                
                $scope.deleteItem = function() {
                    var item = $scope.currentItem;
                    if (confirm("Seguro desea eliminar el item \""+item.get('name')+"\"?") ){
                        item.destroy({
                            success: function(object) {
                                for(var i=0,len=$scope.items.length;i<len;i++) {
                                    if ($scope.items[i].id==object.id) {
                                        $scope.$apply(function() {
                                            $scope.items.splice(i,1);
                                        });
                                        $rootScope.addAlert($('#categories .alerts'), 'success', 'Item "'+item.get('name')+'" eliminado');
                                        $scope.$apply(function() {
                                            listener();
                                            listenerParent();
                                            listenerParentSub();
                                            changed = false;
                                            $scope.currentItem = null;    
                                        })
                                        break;
                                    }
                                }
                            },
                            error: function() {
                                $rootScope.addAlert($('#categories .alerts'), 'danger', 'Error eliminando el item "'+subcategory.get('name')+'"');
                            }
                        })
                    }
                }
				
				$scope.saveInfo = function(item) {
					try {
                        listener();
                        listenerParentSub();
						item.save(null, {
							success: function(object) {
                                var mensaje = object._existed? "actualizado": "creado";
                                $rootScope.addAlert($('#categories .alerts'), 'success', 'Item "'+item.get('name')+'" '+mensaje);
                                changed = false;
								$scope.$apply(function() {
                                    $scope.currentItem = null;
                                    $scope.parentSubcategories = [];
                                    $scope.isSaving = false;
                                    if (!object._existed) {
                                        $scope.items.push(object);
                                    }
								});
							},
							error: function(object, error) {
								$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando el item "'+item.get('name')+'"');
								$scope.$apply(function() {
									$scope.isSaving = false;
								});
							}
						});
					}catch(e) {
						$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando el item "'+item.get('name')+'"');
						$scope.isSaving = false;
                        $log.error(e);
					}
				}
                $rootScope.loadCategories($scope);
                $rootScope.loadSubcategories($scope);
                $rootScope.loadItems($scope);
                $rootScope.loadDetails($scope);
			}
        })
		.state('details', {
            url: "/details",
            templateUrl: "views/details.html?i="+Math.random(),
			controller: function($scope, $state, $rootScope, $log) {
				$rootScope.activeCategory = 'details';
                var changed = false;
                
                var listener = function() {};
				
                $scope.addDetail = function() {
                    if (!changed) {
                        listener();
                        changed = false;
                        $('#editImage').replaceWith($('#editImage').clone(true));
                        
                        $scope.currentDetail = new Parse.Object("DetailType");
                        $scope.cloneDetail = $scope.currentDetail.clone();
                        
                        listener = $scope.$watch('currentDetail.attributes', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                    } else {
                        if (confirm("Hay cambios sin guardar\n ¿Dese continuar?")) {
                            $scope.undo();
                            changed = false;
                            $scope.addDetail();
                        }
                    }
				}
				
				$scope.editDetail = function(index) {
                    if (!changed) {
                        listener();
                        changed = false;
                        $('#editImage').replaceWith($('#editImage').clone(true));
                        
                        $scope.currentDetail = $scope.details[index];
                        $scope.cloneDetail = $scope.currentDetail.clone();
                        
                        listener = $scope.$watch('currentDetail.attributes', function(newvalue, oldvalue) {
                            if (oldvalue!=newvalue) {
                                changed = true;
                            }
                        },true);
                        
                    } else {
                        if (confirm("Hay cambios sin guardar\n ¿Dese continuar?")) {
                            $scope.undo();
                            changed = false;
                            $scope.editDetail(index);
                        }
                    }
				}
                
                $scope.undo = function() {
                    for(param in $scope.currentDetail) {
                        if (param!="id") {
                            $scope.currentDetail[param] = $scope.cloneDetail[param];
                        }
                    }
                }
				
				$scope.fileNameChanged = function() {
					input = $('#editImage')[0];
					if (input.files && input.files[0]) {
					var reader = new FileReader();
					reader.onload = function (e) {
						$('#imageEdit').attr('src', e.target.result);
					};
					reader.readAsDataURL(input.files[0]);
				  }
				}
				
				$scope.saveDetail = function(btn) {
					$scope.isSaving = true;
					var category = $scope.currentDetail;
                    for (var prop in category.attributes) {
                        category.set(prop, category.attributes[prop])
                    }
					if ($('#editImage')[0].files[0]) {
						var file = $('#editImage')[0].files[0];
						var name = file.name;
						var parseFile = new Parse.File(name, file);
						parseFile.save({
							success: function(object) {
								category.set('image', parseFile);
								$scope.saveInfo(category);
							},
							error: function(object, error) {
								$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando el detalle "'+category.get('name')+'"');
								$scope.$apply(function() {
									$scope.isSaving = false;
								});
							}
						});
					}
					else {
						$scope.saveInfo(category);
					}
				}
                
                $scope.deleteCategory = function() {
                    var category = $scope.currentDetail;
                    if (confirm("Seguro desea eliminar el detalle \""+category.get('name')+"\"?") ){
                        category.destroy({
                            success: function(object) {
                                for(var i=0,len=$scope.categories.length;i<len;i++) {
                                    if ($scope.details[i].id==object.id) {
                                        $scope.$apply(function() {
                                            $scope.details.splice(i,1);
                                        });
                                        $rootScope.addAlert($('#categories .alerts'), 'success', 'Detalle "'+category.get('name')+'" eliminado');
                                        $scope.$apply(function() {
                                            listener();
                                            changed = false;
                                            $scope.currentDetail = null;
                                        })
                                        break;
                                    }
                                }
                            },
                            error: function() {
                                $rootScope.addAlert($('#categories .alerts'), 'danger', 'Error eliminando la categoría "'+category.get('name')+'"');
                            }
                        })
                    }
                }
				
				$scope.saveInfo = function(category) {
					try {
						category.save(null, {
							success: function(object) {
                                var mensaje = object._existed? "actualizado": "creado";
                                $rootScope.addAlert($('#categories .alerts'), 'success', 'Detalle "'+category.get('name')+'" '+mensaje);
                                listener();
                                changed = false;
								$scope.$apply(function() {
                                    $scope.currentDetail = null;
									$scope.isSaving = false;
                                    if (!object._existed) {
                                        $scope.details.push(object);
                                    }
								});
							},
							error: function(object, error) {
								$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando el detalle "'+category.get('name')+'"');
								$scope.$apply(function() {
									$scope.isSaving = false;
								});
							}
						});
					}catch(e) {
						$rootScope.addAlert($('#categories .alerts'), 'danger', 'Error actualizando la categoría "'+category.get('name')+'"');
						$scope.$apply(function() {
							$scope.isSaving = false;
						});
					}
				}
                $rootScope.loadDetails($scope);
			}
        });
    });
    
    app.controller('La20AdminController', ['$scope', '$log','$state','$rootScope', function($scope, $log, $state,$rootScope) {
        
        Parse.initialize("F3eO0eKHWl61MGxA71LkdXNMm2GkrZ5hiFUjOpPh", "VdWbXcEznLe6UA8GDZN4S9Aw0RQv4hzYZ5IRIY90");
        
		$rootScope.goTo = function(url, params){
            $scope.params = params;
            $state.transitionTo(url,params)
        }
		
		$rootScope.addAlert = function(element, tipo, mensaje) {
			var alerta = $('<div class="alert alert-'+tipo+' alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'+mensaje+'.</div>');
			element.prepend(alerta);
			alerta.fadeTo(2000, 500).slideUp(500, function(){
               alerta.alert('close');
            });
		}
        
        
        $rootScope.loadBanners = function($currentScope) {
            $currentScope.banners = [];
            try {
                var Banner = Parse.Object.extend("Banner");
                var query = new Parse.Query(Banner);
                query.ascending('order');
                query.limit(1000);
                query.find({
                    success: function(results) {
                        $currentScope.$apply(function() {
                            $currentScope.banners = results;
                        });
                    },
                    error: function(error) {
                        if (error.code==100) {
                            $log.info("Conexión");
                        }
                    }
                });
            }catch(e) {
                $log.error(e);
            }
        }
		
		$rootScope.loadCategories = function($currentScope) {
            $currentScope.categories = [];
            try {
                var Category = Parse.Object.extend("Category");
                var query = new Parse.Query(Category);
                query.ascending('order');
                query.limit(1000);
                query.find({
                    success: function(results) {
                        $currentScope.$apply(function() {
                            $currentScope.categories = results;
                        });
                    },
                    error: function(error) {
                        if (error.code==100) {
                            $log.info("Conexión");
                        }
                    }
                });
            }catch(e) {
                $log.error(e);
            }
        }
        
        $rootScope.loadSubcategories = function($currentScope) {
            $currentScope.subcategories = [];
            try {
                var Subcategory = Parse.Object.extend("Subcategory");
                var query = new Parse.Query(Subcategory);
                query.limit(1000);
                query.ascending('order');
                query.find({
                    success: function(results) {
                        $currentScope.$apply(function() {
                            $currentScope.subcategories = results;
                        });
                    },
                    error: function(error) {
                        if (error.code==100) {
                            $log.info("Conexión");
                        }
                    }
                });
            }catch(e) {
                $log.error(e);
            }
        }
        
        $rootScope.loadItems = function($currentScope) {
            $currentScope.items = [];
            try {
                var Item = Parse.Object.extend("Item");
                var query = new Parse.Query(Item);
                query.limit(1000);
                query.descending('numeric_price');
                query.find({
                    success: function(results) {
                        $currentScope.$apply(function() {
                            $currentScope.items = results;
                        });
                    },
                    error: function(error) {
                        if (error.code==100) {
                            $log.info("Conexión");
                        }
                    }
                });
            }catch(e) {
                $log.error(e);
            }
        }
        
        $rootScope.loadDetails = function($currentScope) {
            $currentScope.details = [];
            try {
                var Detail = Parse.Object.extend("DetailType");
                var query = new Parse.Query(Detail);
                query.ascending('name');
                query.find({
                    success: function(results) {
                        $currentScope.$apply(function() {
                            $currentScope.details = results;
                        });
                    },
                    error: function(error) {
                        if (error.code==100) {
                            $log.info("Conexión");
                        }
                    }
                });
            }catch(e) {
                $log.error(e);
            }
        }
        
    }]);
    
    app.filter('specialSubcategories', function() {
        return function( items) {
            var filtered = [];
            angular.forEach(items, function(item) {
                if(item.attributes.special) {
                    filtered.push(item);
                }
            });
            return filtered;
        };
    });
    
    app.filter('notSpecialSubcategories', function() {
        return function( items) {
            var filtered = [];
            angular.forEach(items, function(item) {
                if(!item.attributes.special) {
                    filtered.push(item);
                }
            });
            return filtered;
        };
    });
    
    app.filter('forCategory', function() {
        return function( items,category) {
            var filtered = [];
            if (category) {
                angular.forEach(items, function(item) {
                    if((item.attributes.category && item.attributes.category.id==category.id) || (item.attributes.subcategory && item.attributes.subcategory.id==category.id)) {
                        filtered.push(item);
                    }
                });
            }
            return filtered;
        };
    });
    
    app.filter('searchValue', function() {
        return function( items,search) {
            var filtered = [];
            if (search && search!="") {
                angular.forEach(items, function(item) {
                    if(item.attributes.name.toUpperCase().indexOf(search.toUpperCase())>=0) {
                        filtered.push(item);
                    }
                });
            } else {
                filtered = items;
            }
            return filtered;
        };
    });
    
    app.directive('categoria', function() {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function(scope, elem, attrs, ngModel) {
                if(!ngModel) { return; } // do nothing if no ng-model
    
                // watch own value and re-validate on change
                scope.$watch(attrs.ngModel, function() {
                    validate();
                });
    
                // observe the other value and re-validate on change
                attrs.$observe('categoria', function (val) {
                    validate();
                });
    
                var validate = function() {
                    var val1 = ngModel.$viewValue==null?"":ngModel.$viewValue;
                    var val2 = attrs.categoria==null?"":attrs.categoria;
                    
                    // set validity
                    ngModel.$setValidity('categoria', (val1!="" && val2=="") || (val2!="" && val1==""));
                };
            }
        };
    });
    
    app.directive('subcategoria', function() {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function(scope, elem, attrs, ngModel) {
                if(!ngModel) { return; } // do nothing if no ng-model
    
                // watch own value and re-validate on change
                scope.$watch(attrs.ngModel, function() {
                    validate();
                });
    
                // observe the other value and re-validate on change
                attrs.$observe('subcategoria', function (val) {
                    validate();
                });
    
                var validate = function() {
                    var val1 = ngModel.$viewValue==undefined?"":ngModel.$viewValue;
                    var val2 = attrs.subcategoria==undefined?"":attrs.subcategoria;
                    
                    ngModel.$setValidity('subcategoria', (val1!="" && val2=="") || (val2!="" && val1==""));
                };
            }
        };
    });
    
})();