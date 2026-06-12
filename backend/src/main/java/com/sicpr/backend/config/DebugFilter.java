package com.sicpr.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Profile("dev")
@Slf4j
public class DebugFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        
        log.debug("Request {} {} contentType={}", request.getMethod(), request.getRequestURI(), request.getHeader("Content-Type"));
         
        filterChain.doFilter(request, response);
         
        log.debug("Response {} {} status={}", request.getMethod(), request.getRequestURI(), response.getStatus());
    }
}
