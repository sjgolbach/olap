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


DimensionItemView = Backbone.Marionette.ItemView.extend({
	tagName: 'li',
	template: '#dimension-item',

	events: {
		"click": "clickItem",
	},

	clickItem: function(){
		App.vent.trigger("remove:item", this.model);
	},
});

DimensionView = Backbone.Marionette.CollectionView.extend({
	tagName: 'ul',

	childView: DimensionItemView,

});


DimensionsLayout = Backbone.Marionette.LayoutView.extend({
	template: "#dimension",

	regions: {
		products: "#products",
		dates: "#dates",
		domains: "#domains",
		selected_products: "#selected_products",
		selected_dates: "#selected_dates",
		selected_domains: "#selected_domains",
	},

	initialize: function(){
		App.dimension = {};
		App.dimension.products = new DimensionKeys(products);
		App.dimension.dates = new DimensionKeys(dates);
		App.dimension.domains = new DimensionKeys(domains);
		App.selected = {};
		App.selected.products = new DimensionKeys();
		App.selected.dates = new DimensionKeys();
		App.selected.domains = new DimensionKeys();
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

		var dates = App.selected.dates.models;
		var products = App.selected.products.models;
		var domains = App.selected.domains.models;

		var data = {
			products: _.pluck(products, 'id'),
			dates: _.pluck(dates, 'id'),
			domains: _.pluck(domains, 'id'),
		};

		$.when(
			$.post("/site/results", data, function(response) {
				App.results = response;
			} )
		).then(function() {
			console.log('finished...')

				categories = _.pluck(dates, 'id');

				$('#highcharts').highcharts({
					chart: {
						type: 'column'
					},
					title: {
						text: ''
					},
					xAxis: {
						categories: categories,
						crosshair: true
					},
					yAxis: {
						min: 0,
					},
					tooltip: {
						headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
						pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
							'<td style="padding:0"><b>{point.y}</b></td></tr>',
						footerFormat: '</table>',
						shared: true,
						useHTML: true
					},
					plotOptions: {
						column: {
							pointPadding: 0.2,
							borderWidth: 0
						}
					},
					series: App.results
				});

		});

	},

	selectItem: function(type, key){
		console.log('selectItem...');
		console.log(type + ':' + key);
		var model = App.dimension[type].find(function(model) { return model.get('id') == key; });
		console.log(model);
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

	App.dimensionsLayout = new DimensionsLayout();

	App.form.show( App.dimensionsLayout );

	// products

	$('#products').on('select_node.jstree', function (e, data) {
		key = data.selected[0];
		App.selectItem('products',key)
	}).jstree( { 'core' : { 'data' : products } } );

	var selectedProductView = new DimensionView({collection: App.selected.products});
	App.dimensionsLayout.showChildView('selected_products', selectedProductView );

	// dates

	$('#dates').on('select_node.jstree', function (e, data) {
		key = data.selected[0];
		App.selectItem('dates',key)
	}).jstree( { 'core' : { 'data' : dates } } );

	var selectedDateView = new DimensionView({collection: App.selected.dates});
	App.dimensionsLayout.showChildView('selected_dates', selectedDateView );

	// domains

	$('#domains').on('select_node.jstree', function (e, data) {
		key = data.selected[0];
		App.selectItem('domains',key)
	}).jstree( { 'core' : { 'data' : domains } } );

	var selectedDomainView = new DimensionView({collection: App.selected.domains});
	App.dimensionsLayout.showChildView('selected_domains', selectedDomainView );


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



