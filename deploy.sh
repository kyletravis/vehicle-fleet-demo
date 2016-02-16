cd platform/configserver
cf push

cd ../../platform/eureka
cf push

cd ../../platform/hystrix-dashboard
cf push

cd ../../fleet-location-simulator
cf push

cd ../fleet-location-ingest
cf push

cd ../fleet-location-updater
cf push

cd ../fleet-location-service
cf push

cd ../service-location-service
cf push

cd ../dashboard
cf push
