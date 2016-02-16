Vehicle Fleet for micropcf
=============

Demo system for RentMe fleet of connected rental trucks. Each truck in
our fleet sends us telemetry data updates, including location, heading
and various internal indicators, including whether of not a service is
required. The user can browse all the vehicle locations via a zoomable
map with an inset containing all the vehicle details. Vehicles that
need a service are shown in orange or red depending on the urgency of
the repairs. Service stations can be shown on the map by selecting a
menu item.

This version has been refactored for micropcf with updated instructions

The original sources are located here(https://github.com/springone2gx2015/vehicle-fleet-demo)

Screenshots

![dashboard](https://raw.githubusercontent.com/myminseok/vehicle-fleet-demo/master/dashboard.png)
![rabbitmq](https://raw.githubusercontent.com/myminseok/vehicle-fleet-demo/master/rabbitmq.png)
![eureka](https://raw.githubusercontent.com/myminseok/vehicle-fleet-demo/master/eureka.png)

## Updated Instructions

### Prerequisites

MBP with 16GB RAM preferred

1. Vagrant https://www.vagrantup.com/downloads.html
1. VirtualBox https://www.virtualbox.org/wiki/Downloads
1. Docker https://www.docker.com/

### Clone this repository

    git clone https://github.com/kyletravis/vehicle-fleet-demo.git

### Deploy micropcf (v0.6.0)

    vagrant up

This process may take 10+ minutes as it spins up the various components of Cloud Foundry. Additional information can be found at https://github.com/pivotal-cf/micropcf

### Connect to micropcf

    cf api api.local.micropcf.io --skip-ssl-validation
    cf login

Use 'admin' for Email and 'admin' for Password (minus quotes)

### Start docker machine

    docker-machine start docker
    eval $(docker-machine env docker)

This assumes a docker machine has already been created named "docker". If you have not yet created a docker machine, check out this link for instructions on creating one: https://docs.docker.com/machine/get-started/

### Start external services required via docker

    docker-compose up -d

### Open outbound connectivity from Cloud Foundry space to external services

    ./create_security_group.sh

### Create a DB in MySQL

    echo "create database fleet" | docker run --rm -it --tty=false --net=host mariadb mysql -h `docker-machine ip docker` -u root -pmysql

If you created your own docker machine named something other than 'docker' then you need to adjust that argument in the command above

### Create User-Provided Services within micropcf

    DOCKER_IP=`docker-machine ip docker`
    sed -i -e "s/__IP__/$DOCKER_IP/" cups.sh
    ./cups.sh

## Deploy Fleet Demo microservices

### Check out sources

several changes have been made from original for micropcf such as manifests.yml, application.yml, pom.xml,bootstrap.yml..
spring jpa setting for fleet-location-service in application.yml.

    $ git clone https://github.com/myminseok/vehicle-fleet-demo.git


### Compile, test and build all jars

you need java 8

	$ ./mvnw clean install


### deploying

visit each module directory and run 'cf push'. (timeout 180 sec in manifests.yml)
make sure there is no error by monitoring 'cf logs'

	$ cd platform/configserver
	$ cf push
	http://configserver.local.micropcf.io/admin/health

	$ cd platform/eureka
	$ cf push
	$ cf logs fleet-eureka-server
	http://fleet-eureka-server.local.micropcf.io/

	$ cd platform/hystrix-dashboard
	$ cf push
	http://fleet-hystrix-dashboard.local.micropcf.io

	$ cd fleet-location-simulator
	$ cf push
	http://fleet-location-simulator.local.micropcf.io

	$ cd fleet-location-ingest
	$ cf push

    $ cd fleet-location-updater
    $ cf push

	$ cd fleet-location-service
	$ cf push

	$ cd service-location-service
	$ cf push

	$ cd dashboard
	$ cf push


#### Start Demo by Script

If you go to the Eureka Dashboard, you should see all services registered and running:

http://fleet-eureka-server.local.micropcf.io/

    * DASHBOARD
    * FLEET-LOCATION-INGEST
    * FLEET-LOCATION-SERVICE
    * FLEET-LOCATION-SIMULATOR
    * FLEET-LOCATION-UPDATER
    * SERVICE-LOCATION-SERVICE

Please ensure all services started successfully. Next, start the simulation using the `service-location-simulator` application,

    $ cd scripts
    $ load.sh
    Loading data...
    Starting simulator...
    **** Vehicle Fleet Demo is running on http://fleet-dashboard.local.micropcf.io



to see rabbitmq status

http://rabbitmq_ip:15672/

to see dashboard

http://fleet-dashboard.local.micropcf.io


Enjoy!


## Trouble shooting

**this demo requires internet connection**

        for DNS resolution
        for configserver connection to git.

**spring cloud configserver should run first without error**

        cf logs configserver

        http://configserver.local.micropcf.io/admin/health should show configServer > repositories > sources > https://...:

        {
        status: "UP",
        configServer: {
            status: "UP",
            repositories: [
            {
                sources: [
                "https://github.com/myminseok/vehicle-fleet-demo/application.yml"
                ],
                name: "app",
                profiles: [
                "default"
                ],
                label: null
            }
            ]


**each APP should start up without error**

        should start with the RIGHT configserver that is http://configserver.local.micropcf.io/,  not http://localhost:8761/

        cf logs APP_NAME
        ex) cf logs fleet-location-service


        2016-02-05T10:02:54.25+0900 [APP/0]      OUT   .   ____          _            __ _ _
        2016-02-05T10:02:54.25+0900 [APP/0]      OUT  /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
        2016-02-05T10:02:54.25+0900 [APP/0]      OUT ( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
        2016-02-05T10:02:54.25+0900 [APP/0]      OUT  \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
        2016-02-05T10:02:54.25+0900 [APP/0]      OUT   '  |____| .__|_| |_|_| |_\__, | / / / /
        2016-02-05T10:02:54.25+0900 [APP/0]      OUT  =========|_|==============|___/=/_/_/_/
        2016-02-05T10:02:54.25+0900 [APP/0]      OUT  :: Spring Boot ::        (v1.3.0.RELEASE)
        2016-02-05T10:02:54.29+0900 [APP/0]      OUT 2016-02-05 01:02:54.299  INFO 23 --- [trace=,span=] [
        main] c.c.c.ConfigServicePropertySourceLocator : Fetching config from server at: http://configserver.local.micropcf.io/
        2016-02-05T10:02:54.65+0900 [HEALTH/0]   OUT healthcheck failed

**check connectivity from container to external service**

        if there is connection problem from container to external service(rabbitmq, mongodb, mysql) in the logs,
        then check connectivity.

        1) ssh into container by putting '-k' option to skip validation
        $ cf ssh APP_NAME -k

        2) doing 'curl' should return some message from external target

        vcap@bv553k6mega:~$ curl 192.168.67.2:3306
        5.5.47-0ubuntu0.14.04.1+[pFI|ToR??+}Wz$@Te#xX,mysql_native_password!??#08S01Got packets out of ordervcap@bv553k6mega:~$

        if there is no return or hung, then check external process or security_group of micropcf space.


**check app registration to eureka**

        http://fleet-eureka-server.local.micropcf.io/
