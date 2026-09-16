def test_patient_own_profile_access(client, patient_user):
    patient_id = patient_user["user"].id
    # Test /me/profile
    res1 = client.get("/api/v1/patients/me/profile", headers=patient_user["headers"])
    assert res1.status_code == 200
    assert res1.json()["user_id"] == str(patient_id)

    # Test /{patient_id}/profile (previously failed with 403)
    res2 = client.get(f"/api/v1/patients/{patient_id}/profile", headers=patient_user["headers"])
    assert res2.status_code == 200
    assert res2.json()["user_id"] == str(patient_id)


def test_doctor_and_caretaker_dashboards(client, patient_user, doctor_user, caretaker_user, setup_relationships):
    # Doctor dashboard
    doc_res = client.get("/api/v1/doctors/dashboard", headers=doctor_user["headers"])
    assert doc_res.status_code == 200
    doc_data = doc_res.json()
    assert len(doc_data["patients"]) == 1
    assert doc_data["patients"][0]["patient"]["id"] == str(patient_user["user"].id)

    # Caretaker dashboard
    care_res = client.get("/api/v1/caretakers/dashboard", headers=caretaker_user["headers"])
    assert care_res.status_code == 200
    care_data = care_res.json()
    assert care_data["total_patients"] == 1
    assert care_data["patients"][0]["patient"]["id"] == str(patient_user["user"].id)

    # Patient listing doctors and caregivers
    my_docs = client.get("/api/v1/patients/me/doctors", headers=patient_user["headers"])
    assert my_docs.status_code == 200
    assert len(my_docs.json()) == 1

    my_cares = client.get("/api/v1/patients/me/caregivers", headers=patient_user["headers"])
    assert my_cares.status_code == 200
    assert len(my_cares.json()) == 1
