package com.example.filterx.dto;

public class CategoryDTO {
    private Long id;
    private String name;
    private String description;
    private String color;
    
    // Constructors
    public CategoryDTO() {}
    
    public CategoryDTO(Long id, String name, String description, String color) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.color = color;
    }
    
    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}