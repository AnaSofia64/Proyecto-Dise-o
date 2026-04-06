package com.parkflow.repository.jpa;

import com.parkflow.entity.SpotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SpotJpaRepository extends JpaRepository<SpotEntity, String> {
    List<SpotEntity> findByOccupied(boolean occupied);
    List<SpotEntity> findByTypeAndOccupied(String type, boolean occupied);
}