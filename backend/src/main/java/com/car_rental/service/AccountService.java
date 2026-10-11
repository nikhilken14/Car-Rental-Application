package com.car_rental.service;

import com.car_rental.model.Account;
import com.car_rental.repository.AccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Locale;

@Service
public class AccountService {
    private final AccountRepository repo;
    private final PasswordEncoder encoder;

    public AccountService(AccountRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public Account current(Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in.");
        return repo.findByEmail(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account not found."));
    }

    public Account register(String name, String email, String password, String role) {
        if (name == null || name.isBlank() || name.trim().length() > 100 || email == null || email.length() > 254 || !email.trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") || password == null || password.length() < 8 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72 || (!"CUSTOMER".equals(role) && !"RENTER".equals(role)))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide a name, valid email, 8–72 byte password and a valid account role.");
        email = email.trim().toLowerCase(Locale.ROOT);
        if (repo.existsByEmail(email))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        var account = new Account();
        account.setName(name.trim());
        account.setEmail(email);
        account.setPasswordHash(encoder.encode(password));
        account.setRole(role);
        try {
            return repo.save(account);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
    }
}
