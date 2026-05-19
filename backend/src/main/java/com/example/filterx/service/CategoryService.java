package com.example.filterx.service;

import com.example.filterx.dto.CategoryDTO;
import com.example.filterx.entity.Category;
import com.example.filterx.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CategoryService {
    
    @Autowired
    private CategoryRepository categoryRepository;
    
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findAllByOrderByNameAsc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    private CategoryDTO convertToDTO(Category category) {
        return new CategoryDTO(
            category.getId(),
            category.getName(),
            category.getDescription(),
            category.getColor()
        );
    }
    
    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }
    
    // FIXED: Changed parameter type from java.util.Locale.Category to your entity Category
    public Category createCategory(Category category) {
    return categoryRepository.save(category);
    }

    
    public Category updateCategory(Long id, Category categoryDetails) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        
        category.setName(categoryDetails.getName());
        category.setDescription(categoryDetails.getDescription());
        category.setColor(categoryDetails.getColor());
        
        return categoryRepository.save(category);
    }
    
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
        categoryRepository.delete(category);
    }
    
    public boolean categoryExists(String name) {
        return categoryRepository.existsByName(name);
    }
}