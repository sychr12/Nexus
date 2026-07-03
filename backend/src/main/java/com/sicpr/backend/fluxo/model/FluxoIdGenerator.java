package com.sicpr.backend.fluxo.model;

import java.util.UUID;

final class FluxoIdGenerator {

    private FluxoIdGenerator() {
    }

    static String generate(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().replace("-", "");
    }
}
