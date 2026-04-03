package com.parkflow.dto;

public class TicketResponse {
    private String ticketId;
    private String licensePlate;
    private String spotId;
    private String entryTime;
    private String status;

    public TicketResponse(String ticketId, String licensePlate, 
                          String spotId, String entryTime, String status) {
        this.ticketId = ticketId;
        this.licensePlate = licensePlate;
        this.spotId = spotId;
        this.entryTime = entryTime;
        this.status = status;
    }

    public String getTicketId() { return ticketId; }
    public String getLicensePlate() { return licensePlate; }
    public String getSpotId() { return spotId; }
    public String getEntryTime() { return entryTime; }
    public String getStatus() { return status; }
}