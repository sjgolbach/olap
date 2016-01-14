/*----------------------------------------------------------------------*/
//  ENTITIES
/*----------------------------------------------------------------------*/

DimensionKey = Backbone.Model.extend({});

DimensionKeys = Backbone.Collection.extend({
	
	model: DimensionKey,

	initialize: function(models, options) {
		this.comparator = 'text';
	},

});

DimensionSelectedItemView = Backbone.Marionette.ItemView.extend({
	tagName: 'li',
	template: '#dimension-selected-item',

	events: {
		"click": "clickItem",
	},

	clickItem: function(){
		console.log('click!');
		App.vent.trigger("remove:item", this.model);
	},
});

DimensionSelectedView = Backbone.Marionette.CollectionView.extend({

	el: function(){
		return "#selected_" + this.options.dimension;
	},

	tagName: 'ul',

	childView: DimensionSelectedItemView,

});

DimensionsForm = Backbone.Marionette.ItemView.extend({

	template: "#form",

	//template: false,

	initialize: function(){
		App.dimension = {};
		App.selected = {};
		$.each(dimensions, function( index, dimension ) {
			App.dimension[dimension] = new DimensionKeys(data[dimension]);
			App.selected[dimension] = new DimensionKeys();
		});
	},

	events: {
		"click #submit": "clickSubmit",
	},

	clickSubmit: function(){
		console.log('click submit!');
		App.vent.trigger("click:submit");
	},

});





/*----------------------------------------------------------------------*/
//  START MARIONETTE
/*----------------------------------------------------------------------*/


MarionetteApp = Marionette.Application.extend({

	initialize: function(options) {
		this.vent = new Backbone.Wreqr.EventAggregator();
		this.vent.on("remove:item", this.removeItem );
		this.vent.on("click:submit", this.clickSubmit );
	},

	removeItem: function(model){
		var dimension = model.get('dimension');
		App.selected[dimension].remove(model);
	},

	clickSubmit: function(){
		console.log('clicking submit...');

		//var dates = App.selected.dates.models;
		//var products = App.selected.products.models;
		//var domains = App.selected.domains.models;

		var data = {};
		data.dimensions = [];
		data.chart_type = $('input[name=chart-type]:checked').val()
		console.log(data.chart_type);

		$.each(dimensions, function( index, dimension ) {
			ids = _.pluck(App.selected[dimension].models, 'id');
			dimension_data = {
				key: dimension,
				ids: ids,
				position: index+1,
			}
			data.dimensions.push(dimension_data)
		});		

		$.when(
			$.post("/site/results", data, function(response) {
				App.highchart = response.highchart;
			} )
		).then(function() {
			$('#highcharts').highcharts( App.highchart )
		});

	},

	selectItem: function(type, key){
		var model = App.dimension[type].find(function(model) { return model.get('id') == key; });
		App.selected[type].add(model);
	},

});


var App = new MarionetteApp();

$(document).ready(function() {
	App.start();

	App.addRegions({
		form:		"#form-region",
		results:	"#results-region",
	});

	App.form.show( new DimensionsForm() );

	App.selectedView = {};
	App.slots = []
	$.each(dimensions, function( index, dimension ) {

		App.selectedView[dimension] = new DimensionSelectedView({collection: App.selected[dimension], dimension: dimension, position: index+1 });
		App.selectedView[dimension].render();
		App.slots[index] = dimension;

		el = $('#'+dimension);
		el.on('select_node.jstree', function (e, data) {
			key = data.selected[0];
			App.selectItem(dimension,key)
		}).jstree( { 'core' : { 'data' : data[dimension] } } );

	});

	$('.draggable').draggable( {
		snap: ".droppable", snapMode: "inner"
	});
	$('.droppable').droppable( {
		drop: handleDropEvent
	});

	function handleDropEvent(){
		console.log('dropped!')
	}

/*
	// products

	var products = new DimensionKeys([],{dimension: 'products' });
	var productView = new DimensionView({collection: products});
	App.dimensionsLayout.showChildView('products', productView );


	// dates

	var dates = new DimensionKeys([],{dimension: 'dates' });
	var dateView = new DimensionView({collection: dates});
	App.dimensionsLayout.showChildView('dates', dateView );


	// domains

	var domains = new DimensionKeys([],{dimension: 'domains' });
	var domainView = new DimensionView({collection: domains});
	App.dimensionsLayout.showChildView('domains', domainView );

*/

});



