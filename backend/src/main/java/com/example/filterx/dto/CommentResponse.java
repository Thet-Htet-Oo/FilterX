package com.example.filterx.dto;

public class CommentResponse {
    private String result; // "Clean" or "Toxic"
    private int offensive;

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public int getOffensive() { return offensive; }
    public void setOffensive(int offensive) { this.offensive = offensive; }
}
