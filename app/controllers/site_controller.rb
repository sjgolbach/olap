class SiteController < ApplicationController

	def index
		dimensions = []
		dimensions << {:position => 1, :name => 'dates'}
		dimensions << {:position => 2, :name => 'products'}
		dimensions << {:position => 3, :name => 'domains'}
		@data = {}
		@dimensions = dimensions.sort_by{|d| d[:position]}
		@dimensions.each do |dimension|
			@data[dimension[:name]] = get_key_values(dimension[:name])
		end
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
		dimensions.each do |key, dimension|
			puts dimension
			position = dimension['position']
			ids[position] = dimension['ids']
		end

		values = []
		ids['3'].each do |d3|
			ids['2'].each do |d2|
				ary = []
				ids['1'].each do |d1|
					key = "#{d1}:#{d2}:#{d3}"
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


