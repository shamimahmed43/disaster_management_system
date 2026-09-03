-- Table: DISASTER_EVENT
CREATE TABLE DISASTER_EVENT (
    disaster_id     VARCHAR2(50) PRIMARY KEY,
    disaster_name   VARCHAR2(200) NOT NULL,
    disaster_type   VARCHAR2(100) NOT NULL,
    division        VARCHAR2(100) NOT NULL,
    district        VARCHAR2(100) NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE,
    severity_level  VARCHAR2(50) NOT NULL,
    status          VARCHAR2(50) NOT NULL
);

-- Table: WAREHOUSE
CREATE TABLE WAREHOUSE (
    warehouse_id    VARCHAR2(50) PRIMARY KEY,
    warehouse_name  VARCHAR2(200) NOT NULL,
    location        VARCHAR2(255) NOT NULL,
    capacity        NUMBER NOT NULL,
    manager_name    VARCHAR2(100)
);

-- Table: VEHICLE
CREATE TABLE VEHICLE (
    vehicle_id       VARCHAR2(50) PRIMARY KEY,
    vehicle_type     VARCHAR2(100) NOT NULL,
    registration_no  VARCHAR2(50) UNIQUE NOT NULL,
    capacity         NUMBER,
    current_status   VARCHAR2(50) NOT NULL
);

-- Table: PERSONNEL
CREATE TABLE PERSONNEL (
    person_id      VARCHAR2(50) PRIMARY KEY,
    name           VARCHAR2(200) NOT NULL,
    phone          VARCHAR2(20),
    base_location  VARCHAR2(200),
    supervisor_id  VARCHAR2(50),
    FOREIGN KEY(supervisor_id) REFERENCES PERSONNEL(person_id)
);

-- Table: SHELTER
CREATE TABLE SHELTER (
    shelter_id            VARCHAR2(50) PRIMARY KEY,
    shelter_name          VARCHAR2(200) NOT NULL,
    capacity              NUMBER NOT NULL,
    shelter_status        VARCHAR2(50) NOT NULL,
    contact_person_name   VARCHAR2(100),
    address_line          VARCHAR2(255),
    latitude              VARCHAR2(30),
    longitude             VARCHAR2(30)
);

-- Table: VICTIM
CREATE TABLE VICTIM (
    victim_id             VARCHAR2(50) PRIMARY KEY,
    household_head_name   VARCHAR2(200) NOT NULL,
    age                   NUMBER,
    gender                VARCHAR2(20),
    nid_number            VARCHAR2(50) UNIQUE,
    reported_date         DATE,
    last_seen_location    VARCHAR2(255),
    missing_person        CHAR(1) CHECK (missing_person IN ('Y','N')),
    disaster_id           VARCHAR2(50) NOT NULL,
    FOREIGN KEY (disaster_id) REFERENCES DISASTER_EVENT(disaster_id)
);

-- Table: VICTIM_PHONE
CREATE TABLE VICTIM_PHONE (
    victim_id  VARCHAR2(50) NOT NULL,
    phone      VARCHAR2(20) NOT NULL,
    PRIMARY KEY (victim_id, phone),
    FOREIGN KEY (victim_id) REFERENCES VICTIM(victim_id)
);

-- Table: VICTIM_SPECIAL_NEEDS
CREATE TABLE VICTIM_SPECIAL_NEEDS (
    victim_id     VARCHAR2(50) NOT NULL,
    special_need  VARCHAR2(200) NOT NULL,
    PRIMARY KEY (victim_id, special_need),
    FOREIGN KEY (victim_id) REFERENCES VICTIM(victim_id)
);

-- Table: FAMILY_MEMBER
CREATE TABLE FAMILY_MEMBER (
    victim_id         VARCHAR2(50) NOT NULL,
    member_seq_no     NUMBER NOT NULL,
    name              VARCHAR2(200) NOT NULL,
    age               NUMBER,
    relation_to_head  VARCHAR2(50),
    PRIMARY KEY (victim_id, member_seq_no),
    FOREIGN KEY (victim_id) REFERENCES VICTIM(victim_id)
);

-- Table: DONATION
CREATE TABLE DONATION (
    donation_id      VARCHAR2(50) PRIMARY KEY,
    donor_name       VARCHAR2(200) NOT NULL,
    donor_id         VARCHAR2(50),
    contact_info     VARCHAR2(200),
    donation_type    VARCHAR2(100) NOT NULL,
    purpose          VARCHAR2(200),
    amount_or_value  NUMBER,
    donation_date    DATE NOT NULL,
    warehouse_id     VARCHAR2(50) NOT NULL,
    FOREIGN KEY (warehouse_id) REFERENCES WAREHOUSE(warehouse_id)
);

-- Table: VOLUNTEER
CREATE TABLE VOLUNTEER (
    person_id            VARCHAR2(50) PRIMARY KEY,
    availability_status  VARCHAR2(50),
    skill                VARCHAR2(200),
    FOREIGN KEY (person_id) REFERENCES PERSONNEL(person_id)
);

-- Table: MEDICAL_STAFF
CREATE TABLE MEDICAL_STAFF (
    person_id       VARCHAR2(50) PRIMARY KEY,
    designation     VARCHAR2(100),
    team_id         VARCHAR2(50),
    specialization  VARCHAR2(100),
    FOREIGN KEY (person_id) REFERENCES PERSONNEL(person_id)
);

-- Table: RESIDES_IN
CREATE TABLE RESIDES_IN (
    victim_id      VARCHAR2(50) NOT NULL,
    shelter_id     VARCHAR2(50) NOT NULL,
    checkin_date   DATE NOT NULL,
    checkout_date  DATE,
    PRIMARY KEY (victim_id, shelter_id, checkin_date),
    FOREIGN KEY (victim_id) REFERENCES VICTIM(victim_id),
    FOREIGN KEY (shelter_id) REFERENCES SHELTER(shelter_id)
);

-- Table: DISTRIBUTION
CREATE TABLE DISTRIBUTION (
    distribution_id    VARCHAR2(50) PRIMARY KEY,
    warehouse_id       VARCHAR2(50) NOT NULL,
    person_id          VARCHAR2(50) NOT NULL,
    shelter_id         VARCHAR2(50) NOT NULL,
    vehicle_id         VARCHAR2(50),
    distribution_date  DATE NOT NULL,
    quantity           NUMBER NOT NULL,
    status             VARCHAR2(50),
    FOREIGN KEY (warehouse_id) REFERENCES WAREHOUSE(warehouse_id),
    FOREIGN KEY (person_id) REFERENCES PERSONNEL(person_id),
    FOREIGN KEY (shelter_id) REFERENCES SHELTER(shelter_id),
    FOREIGN KEY (vehicle_id) REFERENCES VEHICLE(vehicle_id)
);

-- Table: DEPLOYED_AT
CREATE TABLE DEPLOYED_AT (
    person_id        VARCHAR2(50) NOT NULL,
    shelter_id       VARCHAR2(50) NOT NULL,
    deployment_date  DATE,
    PRIMARY KEY (person_id, shelter_id),
    FOREIGN KEY (person_id) REFERENCES PERSONNEL(person_id),
    FOREIGN KEY (shelter_id) REFERENCES SHELTER(shelter_id)
);

-- Table: STATIONED_AT
CREATE TABLE STATIONED_AT (
    warehouse_id  VARCHAR2(50) NOT NULL,
    vehicle_id    VARCHAR2(50) NOT NULL,
    PRIMARY KEY (vehicle_id),
    FOREIGN KEY (warehouse_id) REFERENCES WAREHOUSE(warehouse_id),
    FOREIGN KEY (vehicle_id) REFERENCES VEHICLE(vehicle_id)
);
