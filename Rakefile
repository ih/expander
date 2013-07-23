require 'rubygems'
require 'open-uri'

desc "Backup the live db to local ./dump folder"
task :backup_live_db do
  uri = `meteor mongo expander --url`
  pass = uri.match(/client:([^@]+)@/)[1]
  puts "Using live db password: #{pass}"
  `mongodump -h production-db-a1.meteor.io:27017 -d expander_meteor_com -u client -p #{pass}`
end


desc "Copy live database to local"
task :copy_live_db => :backup_live_db do
  server =  `meteor mongo --url`
  uri = URI.parse(server)
  `mongorestore --host #{uri.host} --port #{uri.port} --db meteor --drop dump/expander_meteor_com/`
end

desc "Restore last backup"
task :restore do
  server =  `meteor mongo --url`
  uri = URI.parse(server)
  `mongorestore --host #{uri.host} --port #{uri.port} --db meteor --drop dump/expander_meteor_com/`
end
