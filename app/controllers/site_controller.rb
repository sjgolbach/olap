class SiteController < ApplicationController

	def index
		@products = get_key_values('products').to_json
		@dates = get_key_values('dates').to_json
		@domains = get_key_values('domains').to_json
	end

	def dimension
		params[:dimension] ||= 'products'
		results = get_key_values(params[:dimension])
		results.sort_by! { |hsh| hsh[:text] }
		render :json => results.to_json

	end

	def results
		values = []
		params['domains'].each do |domain|
			params['products'].each do |product|
				ary = []
				params['dates'].each do |date|
					key = "#{date}:#{product}:#{domain}"
					ary << $redis.get(key).to_i
				end
				values << {:name => product, data: ary }
			end
		end
		render :json => values.to_json
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
