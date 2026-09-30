package com.apkatiffine.repository;

import com.apkatiffine.model.TiffinAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TiffinAttendanceRepository extends JpaRepository<TiffinAttendance, Long> {
    List<TiffinAttendance> findByOrderIdOrderByAttendanceDateAsc(Long orderId);
    Optional<TiffinAttendance> findByOrderIdAndAttendanceDate(Long orderId, LocalDate attendanceDate);
    long countByOrderIdAndStatus(Long orderId, String status);
}
