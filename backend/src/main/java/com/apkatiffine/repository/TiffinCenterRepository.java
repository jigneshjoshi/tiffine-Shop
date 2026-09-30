package com.apkatiffine.repository;

import com.apkatiffine.model.TiffinCenter;
import com.apkatiffine.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TiffinCenterRepository extends JpaRepository<TiffinCenter, Long> {
    Optional<TiffinCenter> findByUser(User user);
    Optional<TiffinCenter> findByUserId(Long userId);
    List<TiffinCenter> findByStatus(String status);
    List<TiffinCenter> findByAreaContainingIgnoreCaseAndStatus(String area, String status);
    List<TiffinCenter> findByCityContainingIgnoreCaseAndStatus(String city, String status);
}
