cf create-user-provided-service mysql-db -p '{"uri":"mysql://root:mysql@__IP__:3306/fleet"}'
cf cups mongodb -p '{"uri":"mongodb://__IP__:27017/locations"}'
cf cups rabbitmq -p '{"uri":"amqp://guest:guest@__IP__:5672/%2f"}'
cf cups configserver -p  '{"uri":"http://configserver.local.micropcf.io/"}'
cf cups eureka -p  '{"uri":"http://fleet-eureka-server.local.micropcf.io/"}'
