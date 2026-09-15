package com.example.demo.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Date;

public class DateTimeUtil {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a");
    private static final DateTimeFormatter DISPLAY_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");

    public static String formatTimeStr(LocalDateTime dateTime) {
        if (dateTime == null) dateTime = LocalDateTime.now();
        return dateTime.format(TIME_FORMATTER);
    }

    public static String formatDisplayDate(LocalDateTime dateTime) {
        if (dateTime == null) dateTime = LocalDateTime.now();
        return dateTime.format(DISPLAY_FORMATTER);
    }

    public static Date toDate(LocalDateTime localDateTime) {
        if (localDateTime == null) return new Date();
        return Date.from(localDateTime.atZone(ZoneId.systemDefault()).toInstant());
    }
}
