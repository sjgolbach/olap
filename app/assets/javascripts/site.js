/*----------------------------------------------------------------------*/
//  ENTITIES
/*----------------------------------------------------------------------*/

Dimension = Backbone.Model.extend({});

Dimensions = Backbone.Collection.extend({
	
	model: Dimension,

	initialize: function(models, options) {
		this.comparator = 'position';
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

DimensionItemView = Backbone.Marionette.ItemView.extend({

	template: '#dimension-item',

});

DimensionView = Backbone.Marionette.CollectionView.extend({

	el: "#dimensions",

	childView: DimensionItemView,

	onRender: function(){
		$.each(App.dimensions.models, function( index, model ) {

			var key = model.get('name');

			model.attributes.selectedView = new DimensionSelectedView({collection: model.attributes.selected, dimension: model.attributes.name }) ;

			model.attributes.selectedView.render();
			
			var data1 = dimensions_data[index];
			var data2 = [];

			$.each(model.attributes.data.models, function( index, model ) {
				data2.push({'id': model.get('id'), 'text': model.get('text'), 'parent' : model.get('parent'), 'dimension': model.get('dimension')});
			})

			console.log(data1);
			console.log(data2);

			// set el to DOM element and make jsTree object
			el = $('#'+key);
			el.on('select_node.jstree', function (e, data) {
				id = data.selected[0];
				App.selectItem(model,id)
			}).jstree( { 'core' : { 'data' : data2 } } );
			
		});
	},

});

DimensionsForm = Backbone.Marionette.ItemView.extend({

	el: '#form',

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
		var key = model.get('dimension');
		var dimension = App.dimensions.models.find(function(model) { return model.get('name') == key; })
		dimension.attributes.selected.remove(model)
	},

	clickSubmit: function(){
		console.log('clicking submit...');

		var data = {};
		data.dimensions = [];
		data.chart_type = $('input[name=chart-type]:checked').val()

		$.each(App.dimensions.models, function( index, model ) {
			ids = _.pluck(model.attributes.selected.models, 'id');
			dimension_data = {
				key: model.get('name'),
				ids: ids,
				position: model.get('position'),
				order: model.get('db_order'),
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

	selectItem: function(dimension, id){
		console.log('selectItem...')
		var model = dimension.get('data').find(function(model) { return model.get('id') == id; });
		dimension.attributes.selected.add(model);
	},

});


var App = new MarionetteApp();

$(document).ready(function() {
	App.start();

	App.addRegions({
		results:	"#results",
	});

	App.dimensions = new Dimensions(dimensions);

	$.each(App.dimensions.models, function( index, dimension ) {
		dimension.set('data', new Dimensions(dimensions_data[index]) )
		dimension.set('selected', new Dimensions() );
	});

	App.form = new DimensionsForm();

	App.dimensionView = new DimensionView({collection: App.dimensions})
	App.dimensionView.render();

	setupDragDrop('create');

	function handleDropEvent(event, ui){
		var source_key = ui.draggable[0].attributes['data-dimension'].value;
		var source_position = parseInt(ui.draggable[0].attributes['data-position'].value);
		var target_key = event.target.attributes['data-dimension'].value;
		var target_position = parseInt(event.target.attributes['data-position'].value);
		console.log('dropped!')
		console.log(source_position);
		console.log(target_position);
		if(source_position !== target_position) {
			var found = false;
			$.each(App.dimensions.models, function( index, model ) {
				if(!found){
					key = model.get('name')
					position = model.get('position')
					//str = "===" + key + " | " + position + " | " + target_position;
					//console.log(str);
					if(position === target_position){
						found = true;
						model.set('position', source_position);
						dropped_model = App.dimensions.models.find(function(model) { return model.get('name') == source_key; });
						dropped_model.set('position', target_position);
					}
				}
			})
			//console.log(App.dimensions)
			setupDragDrop('destroy');
			App.dimensionView.collection.sort();
			//App.dimensionView.render();
			setupDragDrop('create');
		}
		console.log(App.dimensionView);
		//console.log(ui);
	}

	function setupDragDrop(state){
		if(state === 'create'){
			$('.draggable').draggable( {
				snap: ".droppable", 
				snapMode: "inner", 
				revert: "invalid"
			});
			$('.droppable').droppable( {
				tolerance: "intersect",
				drop: handleDropEvent
			});
		} else {
			$('.draggable').draggable('destroy');
			$('.droppable').droppable('destroy');
		}
	}

});



