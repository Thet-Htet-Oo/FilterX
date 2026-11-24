package com.example.filterx.dto;

public class CommentResponse {
    private String result; // "Clean" or "Toxic"
    private int offensive;
    private Double confidence;
    private String note;

    public CommentResponse() {}

    public CommentResponse(String result, int offensive, Double confidence, String note) {
        this.result = result;
        this.offensive = offensive;
        this.confidence = confidence;
        this.note = note;
    }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public int getOffensive() { return offensive; }
    public void setOffensive(int offensive) { this.offensive = offensive; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
