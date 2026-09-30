package com.apkatiffine.repository;

import com.apkatiffine.model.TiffinItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TiffinItemRepository extends JpaRepository<TiffinItem, Long> {
    List<TiffinItem> findByTiffinCenterId(Long tiffinCenterId);
    List<TiffinItem> findByTiffinCenterIdAndAvailableTrue(Long tiffinCenterId);
    List<TiffinItem> findByTiffinCenterStatusAndAvailableTrue(String status);
}
