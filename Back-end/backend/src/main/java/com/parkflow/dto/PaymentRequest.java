package com.parkflow.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public class PaymentRequest {
    private String ticketId;

    @JsonAlias("method")  
    private String paymentMethod;

    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}