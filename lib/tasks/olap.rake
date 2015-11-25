namespace :olap do

	require 'csv'

	def import_keys(type)
		file = "lib/tasks/csv/#{type}.csv"
		puts "- Importing #{file}"
		cnt = 0
		# create default folders
		#$redis.sadd(type, {:id => '#', :text => '#', :parent => '' } )
		#$redis.sadd(type, {:id => type, :text => type, :parent => '#' } )
		# create dimension data
		CSV.foreach(file) do |row|
			$redis.sadd(type, {:id => row[0], :text => row[1], :parent => row[2] } )
			$redis.set("#{type}:#{row[0]}", row[1] )
			print "."
		end		
		puts ""	
	end

	def import_results(type)
		file = "lib/tasks/csv/#{type}.csv"
		puts "- Importing #{file}"
		cnt = 0
		CSV.foreach(file) do |row|
			$redis.set(row[0], row[1])
			print "."
		end		
		puts ""	
	end

	desc "Import daily GTS records"
	task :import => :environment do

		# import dates
		import_keys('dates')

		# import products
		import_keys('products')

		# import domains
		import_keys('domains')

		# import results
		import_results('results')

	end

	desc "Reset redis values"
	task :reset => :environment do

		$redis.del( 'products' )
		$redis.del( 'dates' )
		$redis.del( 'domains' )
	end

end