package com.example.filterx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class FilterXApplication {

    public static void main(String[] args) {
        SpringApplication.run(FilterXApplication.class, args);
    }

    @GetMapping("/")
    public String hello() {
        return "Hello from FilterX New!";
    }

    @GetMapping("/api/test")
    public String test() {
        return "{\"status\": \"OK\", \"message\": \"Test successful\"}";
    }
}
