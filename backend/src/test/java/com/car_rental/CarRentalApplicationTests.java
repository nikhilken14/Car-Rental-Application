package com.car_rental;

import com.car_rental.repository.*;
import com.car_rental.service.AccountService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.http.MediaType;
import jakarta.servlet.http.Cookie;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("demo")
class CarRentalApplicationTests {
    @Autowired
    MockMvc mvc;
    @Autowired
    CarRepository cars;
    @Autowired
    AccountRepository accounts;
    @Autowired
    AccountService service;
    @Autowired
    ObjectMapper json;
    MockHttpSession owner, customer, otherOwner, otherCustomer;

    @BeforeEach
    void setup() throws Exception {
        cars.deleteAll();
        accounts.deleteAll();
        service.register("Owner", "owner@example.test", "Password123!", "RENTER");
        service.register("Customer", "customer@example.test", "Password123!", "CUSTOMER");
        service.register("Other Owner", "otherowner@example.test", "Password123!", "RENTER");
        service.register("Other Customer", "othercustomer@example.test", "Password123!", "CUSTOMER");
        owner = login("owner@example.test", "RENTER");
        customer = login("customer@example.test", "CUSTOMER");
        otherOwner = login("otherowner@example.test", "RENTER");
        otherCustomer = login("othercustomer@example.test", "CUSTOMER");
    }

    MockHttpSession login(String email, String role) throws Exception {
        var result = mvc.perform(post("/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(new java.util.HashMap<String, String>() {{
            put("email", email);
            put("password", "Password123!");
            put("role", role);
        }}))).andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    int add() throws Exception {
        var result = mvc.perform(post("/add").session(owner).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"brand\":\"Tata Nexon\",\"vehicleType\":\"SUV\",\"fuelType\":\"Petrol\",\"capacity\":5,\"pricePerDay\":1800,\"ownerId\":999999}")).andExpect(status().isOk()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).get("id").asInt();
    }

    @Test
    void healthIsPublic() throws Exception {
        mvc.perform(get("/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void loginRegistrationLogoutAndSession() throws Exception {
        mvc.perform(get("/auth/csrf")).andExpect(status().isOk()).andExpect(jsonPath("$.token").isString());
        mvc.perform(get("/auth/me").session(owner)).andExpect(status().isOk()).andExpect(jsonPath("$.role").value("RENTER")).andExpect(jsonPath("$.passwordHash").doesNotExist());
        mvc.perform(post("/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"owner@example.test\",\"password\":\"Password123!\",\"role\":\"CUSTOMER\"}")).andExpect(status().isUnauthorized());
        mvc.perform(post("/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"New User\",\"email\":\"new@example.test\",\"password\":\"Password123!\",\"role\":\"CUSTOMER\"}")).andExpect(status().isCreated()).andExpect(jsonPath("$.passwordHash").doesNotExist());
        assertNotEquals("Password123!", accounts.findByEmail("new@example.test").orElseThrow().getPasswordHash());
        String oldId = owner.getId();
        mvc.perform(post("/auth/logout").session(owner).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/auth/me").cookie(new Cookie("JSESSIONID", oldId))).andExpect(status().isUnauthorized());
    }

    @Test
    void ownershipAndRoleBoundaries() throws Exception {
        int id = add();
        assertEquals(accounts.findByEmail("owner@example.test").orElseThrow().getId(), cars.findById(id).orElseThrow().getOwnerId());
        mvc.perform(get("/fleet").session(otherOwner)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/fleet").session(customer)).andExpect(status().isForbidden());
        mvc.perform(delete("/cars/" + id).session(customer).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(delete("/cars/" + id).session(otherOwner).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(post("/rent/" + id).session(owner).with(csrf()).param("days", "1")).andExpect(status().isForbidden());
        mvc.perform(post("/rent/" + id).with(csrf()).param("days", "1")).andExpect(status().isUnauthorized());
    }

    @Test
    void rentalListsReturnAndDelete() throws Exception {
        int id = add();
        mvc.perform(get("/suggest").param("fuelType", "petrol").param("travelers", "4")).andExpect(jsonPath("$[0].id").value(id));
        mvc.perform(get("/rent-info/" + id).session(customer).param("days", "3")).andExpect(jsonPath("$.totalCost").value(5400));
        mvc.perform(post("/rent/" + id).session(customer).with(csrf()).param("days", "3")).andExpect(status().isOk());
        mvc.perform(post("/rent/" + id).session(otherCustomer).with(csrf()).param("days", "3")).andExpect(status().isConflict());
        mvc.perform(get("/cars")).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/rentals").session(customer)).andExpect(jsonPath("$[0].car.id").value(id));
        mvc.perform(get("/rentals").session(owner)).andExpect(jsonPath("$[0].customerEmail").value("customer@example.test"));
        mvc.perform(get("/rentals").session(otherOwner)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/rentals").session(otherCustomer)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(delete("/cars/" + id).session(owner).with(csrf())).andExpect(status().isConflict());
        mvc.perform(post("/return/" + id).session(otherOwner).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(post("/return/" + id).session(customer).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(post("/return/" + id).session(owner).with(csrf())).andExpect(status().isOk());
        mvc.perform(get("/rentals").session(customer)).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(delete("/cars/" + id).session(owner).with(csrf())).andExpect(status().isNoContent());
        assertFalse(cars.existsById(id));
    }

    @Test
    void validatesInputsAndCsrf() throws Exception {
        int id = add();
        for (String days : new String[]{"0", "-2", "366", "1.5"})
            mvc.perform(post("/rent/" + id).session(customer).with(csrf()).param("days", days)).andExpect(status().isBadRequest());
        mvc.perform(delete("/cars/" + id).session(owner)).andExpect(status().isForbidden());
        mvc.perform(post("/add").session(owner).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"brand\":\"  \",\"capacity\":0,\"pricePerDay\":-1}")).andExpect(status().isBadRequest());
        mvc.perform(post("/auth/register").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Fake\",\"email\":\"fake@example.test\",\"password\":\"Password123!\",\"role\":\"ADMIN\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/rent/999999").session(customer).with(csrf()).param("days", "1")).andExpect(status().isNotFound());
    }
}
