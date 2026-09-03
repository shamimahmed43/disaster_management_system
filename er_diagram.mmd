erDiagram
    %% ==========================================
    %% ENTITIES AND EXACT ATTRIBUTES
    %% ==========================================

    DISASTER_EVENT {
        string disaster_name PK
        string disaster_type
        string division
        string district
        date start_date
        date end_date
        int duration_days "Derived"
    }

    VICTIM {
        string victim_id PK
        string household_head_name
        string gender
        string nid_number
        date reported_date
        string last_known_location
        boolean missing_person
        string contact_phone "Multivalued"
        string special_needs
    }

    %% Weak Entity (Dependent on VICTIM)
    FAMILY_MEMBER {
        string member_seq_no PK "Partial Key"
        string name
    }

    SHELTER {
        string shelter_id PK
        string shelter_name
        string current_status
        string contact_person_name
        string contact_person_phone
        string address_line "Location - Composite"
        string longitude "Location - Composite"
        string latitude "Location - Composite"
        int capacity
        int available_capacity "Derived"
    }

    WAREHOUSE {
        string warehouse_id PK
        string warehouse_name
        string location
        int capacity
        string manager_name
        string status
    }

    DONATION {
        string donation_id PK
        string donor_name
        string donor_id
        string contact_info
        string donation_type
        float amount_or_value
        date donation_date
    }

    PERSONNEL {
        string person_id PK
        string name
        string phone
        string designation
        string base_location
    }

    %% Sub-entities (ISA / Disjoint Specialization of PERSONNEL)
    VOLUNTEER {
        string team
    }

    MEDICAL_STAFF {
        string specialization
        date since_date
    }

    VEHICLE {
        string vehicle_id PK
        string vehicle_type
        string registration_no
        int capacity
        string availability_status
    }

    %% ==========================================
    %% RELATIONSHIPS & AGGREGATION
    %% ==========================================

    DISASTER_EVENT ||--o{ VICTIM : "AFFECTS"
    DISASTER_EVENT ||--o{ SHELTER : "REQUIRES"
    
    %% Identifying Relationship for Weak Entity
    VICTIM ||--|{ FAMILY_MEMBER : "HAS MEMBER (Identifying)"
    
    %% Many-to-Many Relationship with its own Attributes
    VICTIM }|--|{ SHELTER : "RESIDES IN (checkin_date, checkout_date, current_occupancy)"
    
    DONATION }|--|| WAREHOUSE : "STORED IN"
    
    %% DISTRIBUTES acts as an Aggregation (Dashed red box in ERD)
    WAREHOUSE }|--|{ PERSONNEL : "DISTRIBUTES (distribution_id, distribution_date, quantity)"
    
    %% VEHICLE 'USES' the DISTRIBUTES Aggregation 
    VEHICLE }|--o{ WAREHOUSE : "USES (Connects logically to DISTRIBUTES aggregation)"
    
    %% Relationships with Attributes
    PERSONNEL }|--|{ SHELTER : "DEPLOYED AT (deployment_date)"
    PERSONNEL }|--|{ WAREHOUSE : "STATIONED AT"
    
    %% Recursive Relationship with Roles
    PERSONNEL ||--o{ PERSONNEL : "SUPERVISES (Roles: supervisor, supervised personnel)"

    %% ISA Hierarchy Constraints
    PERSONNEL ||--o| VOLUNTEER : "ISA (d)"
    PERSONNEL ||--o| MEDICAL_STAFF : "ISA (d)"
