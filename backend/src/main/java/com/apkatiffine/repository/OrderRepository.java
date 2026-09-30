package com.apkatiffine.repository;

import com.apkatiffine.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findByTiffinCenterId(Long tiffinCenterId);
    List<Order> findByTiffinCenterIdOrderByCreatedAtDesc(Long tiffinCenterId);
    List<Order> findAllByOrderByCreatedAtDesc();
}
