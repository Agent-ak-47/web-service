package com.travelagency.package_service;

import com.travelagency.package_service.config.RequiredSecretsCheck;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PackageServiceApplication {

	public static void main(String[] args) {
		SpringApplication application = new SpringApplication(PackageServiceApplication.class);
		application.addListeners(new RequiredSecretsCheck());
		application.run(args);
	}

}
