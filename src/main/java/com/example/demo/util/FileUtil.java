package com.example.demo.util;

import java.text.DecimalFormat;

public class FileUtil {

    public static String formatFileSize(long sizeInBytes) {
        if (sizeInBytes <= 0) return "0 B";
        final String[] units = new String[]{"B", "KB", "MB", "GB", "TB"};
        int digitGroups = (int) (Math.log10(sizeInBytes) / Math.log10(1024));
        return new DecimalFormat("#,##0.#").format(sizeInBytes / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
    }

    public static String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "";
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }

    public static String determineMediaType(String fileName) {
        String ext = getFileExtension(fileName);
        switch (ext) {
            case "png":
            case "jpg":
            case "jpeg":
            case "gif":
            case "webp":
                return "image";
            case "mp4":
            case "webm":
            case "mkv":
            case "mov":
                return "video";
            case "mp3":
            case "wav":
            case "ogg":
            case "m4a":
                return "audio";
            default:
                return "file";
        }
    }
}
