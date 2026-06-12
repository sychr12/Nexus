package com.sicpr.backend.config;

import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.unit.DataSize;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@Component
@ConfigurationProperties(prefix = "app.upload")
public class UploadSecurityProperties {

    private DataSize messageAttachmentMaxSize = DataSize.ofMegabytes(10);
    private DataSize carteiraPhotoMaxSize = DataSize.ofMegabytes(2);
    private DataSize carteiraBatchPdfMaxSize = DataSize.ofMegabytes(10);
    private DataSize carteiraBatchZipMaxSize = DataSize.ofMegabytes(50);

    @Min(1)
    private int carteiraBatchMaxFiles = 50;

    @Min(1)
    private int carteiraBatchMaxZipEntries = 100;

    public long messageAttachmentMaxBytes() {
        return messageAttachmentMaxSize.toBytes();
    }

    public long carteiraPhotoMaxBytes() {
        return carteiraPhotoMaxSize.toBytes();
    }

    public long carteiraBatchPdfMaxBytes() {
        return carteiraBatchPdfMaxSize.toBytes();
    }

    public long carteiraBatchZipMaxBytes() {
        return carteiraBatchZipMaxSize.toBytes();
    }
}
