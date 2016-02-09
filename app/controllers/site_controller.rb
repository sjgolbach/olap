class SiteController < ApplicationController

	def index
		@dimensions = [
			{:name => 'dates', :position => 2, :db_order => 1},
			{:name => 'products', :position => 1, :db_order => 2},
			{:name => 'domains', :position => 3, :db_order => 3},
		]

		@dimensions.sort_by!{|v| v[:position]}
		@dimension_keys = @dimensions.collect{|d| d[:name]}
		@dimensions_data = @dimensions.collect{|d| get_key_values(d[:name]) }

	end

	def dimension
		params[:dimension] ||= 'products'
		results = get_key_values(params[:dimension])
		results.sort_by! { |hsh| hsh[:text] }
		render :json => results.to_json
	end

	def results
		puts params	
		dimensions = params[:dimensions] # domain, product, date
		chart_type = params[:chart_type] || 'column'

		ids = {}
		db_keys = {}
		dimensions.each do |key, dimension|
			puts dimension
			position = dimension['position']
			order = dimension['order']
			db_keys[position] = order
			ids[position] = dimension['ids']
		end

		values = []
		ids['3'].each do |d3|
			ids['2'].each do |d2|
				ary = []
				ids['1'].each do |d1|
					key1 = eval("d#{db_keys['1']}")
					key2 = eval("d#{db_keys['2']}")
					key3 = eval("d#{db_keys['3']}")
					key = "#{key1}:#{key2}:#{key3}"
					puts key
					ary << $redis.get(key).to_i #
				end
				values << {:name => d2, data: ary }
			end
		end

		highchart = {
			:chart => {
				:type => chart_type,
				:height => 600
			},
			:title => {
				:text => ''
			},
			:xAxis => {
				:categories => ids['1'],
			},
			:yAxis => {
				:min => 0,
			},
			:series => values
		}

		if chart_type == 'stacked-area'
			highchart[:chart][:type] = 'area'
			plot_options = {:area => {:stacking => 'normal'}}
			highchart[:plotOptions] = plot_options
		end

		render :json => {:highchart => highchart}.to_json
	end

private

	def get_key_values(type)
		members = $redis.smembers(type)
		#ary << { :dimension => type, :id => "#", :text => "#" }
		ary = []
		members.each do |member|
			hash = eval(member)
			parents = hash[:parent].split('|')
			parents.each do |parent|
				ary << { :id => hash[:id], :parent => parent, :text => hash[:text], :dimension => type }
			end
		end
		return ary
	end

end


