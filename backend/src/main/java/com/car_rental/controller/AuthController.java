package com.car_rental.controller;

import com.car_rental.service.AccountService;
import com.car_rental.model.Account;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.*;
import org.springframework.security.core.context.*;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import jakarta.servlet.http.*;

import java.util.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AccountService accounts;
    private final AuthenticationManager manager;

    public AuthController(AccountService accounts, AuthenticationManager manager) {
        this.accounts = accounts;
        this.manager = manager;
    }

    public record Credentials(String email, String password, String role) {
    }

    public record Registration(String name, String email, String password, String role) {
    }

    public record Profile(Long id, String name, String email, String role) {
    }

    private Profile profile(Account a) {
        return new Profile(a.getId(), a.getName(), a.getEmail(), a.getRole());
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token) {
        return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
    }

    @GetMapping("/me")
    public Profile me(Authentication auth) {
        return profile(accounts.current(auth));
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Profile register(@RequestBody Registration input) {
        return profile(accounts.register(input.name(), input.email(), input.password(), input.role()));
    }

    @PostMapping("/login")
    public Profile login(@RequestBody Credentials input, HttpServletRequest request, HttpServletResponse response) {
        try {
            if (input.email() == null || input.email().length() > 254 || input.password() == null || input.password().getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72)
                throw new BadCredentialsException("Invalid credentials");
            var authentication = manager.authenticate(new UsernamePasswordAuthenticationToken(input.email().trim().toLowerCase(Locale.ROOT), input.password()));
            var account = accounts.current(authentication);
            if (!account.getRole().equals(input.role())) throw new BadCredentialsException("Wrong portal");
            if (request.getSession(false) != null) request.changeSessionId();
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            new HttpSessionSecurityContextRepository().saveContext(context, request, response);
            new org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository().saveToken(null, request, response);
            return profile(account);
        } catch (AuthenticationException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email/password or account portal.");
        }
    }
}
