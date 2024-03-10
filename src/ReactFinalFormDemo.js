import "primeicons/primeicons.css";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.css";
import "primeflex/primeflex.css";
import "./apple.css";
import "./image.css"

import React, { useState } from "react";
import { Form, Field } from "react-final-form";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Dialog } from "primereact/dialog";
import { createRoot } from "react-dom/client";
import { CascadeSelect } from "primereact/cascadeselect";
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';




import "./FormDemo.css";

export const ReactFinalFormDemo = () => {


  const [showMessage, setShowMessage] = useState(false);
  const [selectedCountry,setSelectedCountry ] = useState('');
  const [formData] = useState({});

  

 

  const [date, setDate] = useState(null);

  const [selectedstats, setSelectedstats] = useState(null);

  const fieldsData = [
    { id: "Mechanical", name: "Mechanical" },
    { id: "IT", name: "Information Technology (IT)" },
    { id: "Medical", name: "Medical" },
    { id: "Finance", name: "Finance" },
    { id: "Education", name: "Education" },
    { id: "Engineering", name: "Engineering" },
    { id: "Art&Design", name: "Art and Design" },
    { id: "Science", name: "Science" },
    { id: "Agriculture", name: "Agriculture" },
    { id: "Healthcare", name: "Healthcare" },
    { id: "Law", name: "Law" },
    { id: "Environmental Science", name: "Environmental Science" },
    { id: "Social Work", name: "Social Work" },
    { id: "Media and Communication", name: "Media and Communication" },
    { id: "Human Resources", name: "Human Resources" },
    { id: "Architecture", name: "Architecture" },
    { id: "Telecommunications", name: "Telecommunications" },
    { id: "Biotechnology", name: "Biotechnology" },
    { id: "Pharmaceuticals", name: "Pharmaceuticals" },
    { id: "Others", name: "Others" },
  ];


  const fieldsOptions = fieldsData.map((field) => ({
    label: field.name,
    value: field.id,
  }));


  const city = [
    { name: "Toronto", id: "Toronto" },
    { name: "NorthYork", id: "Northyork" },
    { name: "Etobicoke", id: "Etobicoke" },
    { name: "Brampton", id: "Brampton" },
    { name: "Mississauga", id: "Mississauga" },
    { name: "Barrie", id: "Barrie" },
    { name: "Kitchner", id: "Kitchner" },
    { name: "Cambridge", id: "Cambridge" },
    { name: "Hamilton", id: "Hamilton" },
    { name: "Oakville", id: "Oakville" },
    { name: "Scarborough", id: "Scarborough" },
    { name: "Other", id: "Other" }
  ];


  const cito = city.map((city) => ({
    label: city.name,
    value: city.id,
  }));

  const college = [
    {"name": "Algoma University", "id": "Algoma University"},
    {"name": "Brock University", "id": "Brock University"},
    {"name": "Carleton University", "id": "Carleton University"},
    {"name": "College Dominicain", "id": "College Dominicain"},
    {"name": "Charles Sturt University, Ontario", "id": "Charles Sturt University, Ontario"},
    {"name": "Lakehead University", "id": "Lakehead University"},
    {"name": "Laurentian University", "id": "Laurentian University"},
    {"name": "Huntington University", "id": "Huntington University"},
    {"name": "Thorneloe University", "id": "Thorneloe University"},
    {"name": "Université de Hearst", "id": "Université de Hearst"},
    {"name": "University of Sudbury", "id": "University of Sudbury"},
    {"name": "McMaster University", "id": "McMaster University"},
    {"name": "Nipissing University", "id": "Nipissing University"},
    {"name": "OCAD University (Ontario College of Art and Design)", "id": "OCAD University (Ontario College of Art and Design)"},
    {"name": "Queen's University", "id": "Queen's University"},
    {"name": "Royal Military College of Canada", "id": "Royal Military College of Canada"},
    {"name": "Ryerson University", "id": "Ryerson University"},
    {"name": "Trent University", "id": "Trent University"},
    {"name": "University of Guelph", "id": "University of Guelph"},
    {"name": "University of Guelph-Humber", "id": "University of Guelph-Humber"},
    {"name": "University of Ontario Institute of Technology", "id": "University of Ontario Institute of Technology"},
    {"name": "University of Ottawa", "id": "University of Ottawa"},
    {"name": "Saint Paul University", "id": "Saint Paul University"},
    {"name": "University of Toronto", "id": "University of Toronto"},
    {"name": "Ontario Institute for Studies in Education (OISE)", "id": "Ontario Institute for Studies in Education (OISE)"},
    {"name": "St. Michael's College", "id": "St. Michael's College"},
    {"name": "Trinity College", "id": "Trinity College"},
    {"name": "Victoria University, including Emmanuel College", "id": "Victoria University, including Emmanuel College"},
    {"name": "University of Waterloo", "id": "University of Waterloo"},
    {"name": "St. Jerome's University", "id": "St. Jerome's University"},
    {"name": "St. Paul's University College", "id": "St. Paul's University College"},
    {"name": "University of Western Ontario", "id": "University of Western Ontario"},
    {"name": "Huron College", "id": "Huron College"},
    {"name": "University of Windsor", "id": "University of Windsor"},
    {"name": "Assumption University", "id": "Assumption University"},
    {"name": "Wilfrid Laurier University", "id": "Wilfrid Laurier University"},
    {"name": "York University", "id": "York University"},
    {"name": "Algonquin College", "id": "Algonquin College"},
    {"name": "Centennial College", "id": "Centennial College"},
    {"name": "Conestoga College", "id": "Conestoga College"},
    {"name": "Confederation College", "id": "Confederation College"},
    {"name": "Fanshawe College", "id": "Fanshawe College"},
    {"name": "Fleming College", "id": "Fleming College"},
    {"name": "George Brown College", "id": "George Brown College"},
    {"name": "Georgian College", "id": "Georgian College"},
    {"name": "Humber College", "id": "Humber College"},
    {"name": "La Cité Collégiale", "id": "La Cité Collégiale"},
    {"name": "Lambton College", "id": "Lambton College"},
    {"name": "Loyalist College", "id": "Loyalist College"},
    {"name": "Mohawk College", "id": "Mohawk College"},
    {"name": "Niagara College", "id": "Niagara College"},
    {"name": "St. Clair College", "id": "St. Clair College"},
    {"name": "St. Lawrence College", "id": "St. Lawrence College"},
    {"name": "Seneca College", "id": "Seneca College"},
    {"name": "Sheridan College", "id": "Sheridan College"},
    {"name": "Yorkville University", "id": "YorkVille University"},
    {"name": "NorthEastern University", "id": "NorthEastern University"},
    {"name": "Sault College", "id": "Sault College"},
    {"name": "Humber College", "id": "Humber College"},
    {"name": "Other ", "id": " Other"}
  ];


  const collego = college.map((college) => ({
    label: college.name,
    value: college.id,
  }));
  const countryCodes = [
    { label: '+1', value: '+1' },
    { label: '+91', value: '+91' },
  ];


  const Status = [
    {
      name: "Student",
      cname: "Student",
    },
    {
      name: "Work Permit",
      cname: "Work Permit",
      states: [
        { cname: "W-Applied Status", code: "C-MO" },
        { cname: "Work Permit Holder", code: "C-QU" },
      ],
    },
    {
      name: "Permanent Resident",
      cname: "Permanent Resident",
      states: [
        { cname: "PR-Applied Status", code: "C-MO" },
        { cname: "Permanent Resident", code: "C-QU" },
      ],
    },
    {
      name: "CanadianCitizen",
      cname: "Canadian Citizen",
    },
  ];

 
 
  const validate = (data) => {
    let errors = {};
  
    if (!data.FirstName) {
      errors.FirstName = "First Name is required.";
    }
  
    if (!data.LastName) {
      errors.LastName = "Last Name is required.";
    }
  
    if (!data.Email) {
      errors.Email = "Email is required.";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(data.Email)) {
      errors.Email = "Invalid email address. E.g. example@email.com";
    }
  
    if (!data.PhoneNumber) {
      errors.PhoneNumber = "Phone Number is required.";
    } else if (!/^\d{10}$/.test(data.PhoneNumber)) {
      errors.PhoneNumber = "Please enter a valid 10-digit  phone number.";
    }
    if (!data.CountryCode) {
      errors.PhoneNumber = "Phone Number is required.";
    } else if (!/^\d{10}$/.test(data.CountryCode)) {
      errors.CountryCode = "Please enter a valid CC.";
    }
    if (!data.Email) {
      errors.PhoneNumber = "Phone Number is required.";
    } else if (!/^\d{10}$/.test(data.Email)) {
      errors.Email = "Please enter a valid Email.";
    }
  
    if (!data.CanadianStatus) {
      errors.CanadianStatus = "Canadian Status is required.";
    }
  
    if (!data.accept) {
      errors.accept = "You need to agree to the terms and conditions.";
    }
  
    return errors;
  };
  

  function Submit() {
    
    const formEle = document.querySelector("form");
    const formData = new FormData(formEle);


    const data = {};
    formData.forEach((value, key) => {
      if (key === "PhoneNumber") {
        // Remove non-numeric characters from the phone number
        value = value.replace(/\D/g, "");
      }
  
      // Handle checkboxes separately to ensure boolean value
      data[key] = key === "accept" ? value === "on" : value;
    });

    console.log("Sending data:", data);

    fetch(
      "https://script.google.com/macros/s/AKfycbxgK3gjbd_SfMZRNzcQRCZrYOEkRk2mxtREgJzZEN8Bz6BHjyZVQoMTqb2A2txJpodO/exec",
      {
        method: "POST", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Response from server:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  const isFormFieldValid = (meta) => !!(meta.touched && meta.error);
  const getFormErrorMessage = (meta) => {
    return (
      isFormFieldValid(meta) && <small className="p-error">{meta.error}</small>
    );
  };

  const dialogFooter = (
    <div className="flex justify-content-center">
      <Button
        label="OK"
        className="p-button-text"
        autoFocus
        onClick={() => setShowMessage(false)}
      />
    </div>
  );

  return (
    
    <div className="form-demo">
       <div className="header">
        <img className="imgheader" src="https://na.baps.org/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fhero2.79f635ad.jpg&w=3840&q=75" alt="HeaderImage"  />
        <div className="header-text">
        <h1 className="RegText"> Sabha Registration</h1>
        </div>
      </div>

      <Dialog
        visible={showMessage}
        onHide={() => setShowMessage(false)}
        position="top"
        footer={dialogFooter}
        showHeader={false}
        breakpoints={{ "960px": "80vw" }}
        style={{ width: "30vw" }}
      >
        <div className="flex items-center flex-col pt-6 px-3">
          <i className="pi pi-check-circle text-5xl text-green-500"></i>
          <h5 className="text-xl">Registration Successful!</h5>
          <p className="leading-6 text-indent-1">
            Your account is registered under name <b>{formData.name}</b>; it'll
            be valid next 30 days without activation. Please check{" "}
            <b>{formData.email}</b> for activation instructions.
          </p>
        </div>
      </Dialog>

      <div className="flex justify-center" style={{ justifyContent: "center" }}>
        <div className="card">
       
          <Form
            onSubmit={Submit}
            initialValues={{
              FirstName: "",
              LastName: "",
              Email: "",

              date: null,
              country: null,
              accept: false,
            }}
            validate={validate}
            render={({ handleSubmit }) => (
              <form action="https://script.google.com/macros/s/AKfycbxgK3gjbd_SfMZRNzcQRCZrYOEkRk2mxtREgJzZEN8Bz6BHjyZVQoMTqb2A2txJpodO/exec" method="post" className="p-fluid netlify">
                <div style={{ display: "flex", gap: "10px" }}>
                  <Field
                    name="FirstName"
                    render={({ input, meta }) => (
                      <div className="field" style={{ width: "50%" }}>
                        <span className="p-float-label">
                          <InputText
                            id="FirstName"
                            {...input}
                            autoFocus
                            className={` ${
                              isFormFieldValid(meta) && "p-invalid"
                            }`}
                          />
                          <label
                            htmlFor="FirstName"
                            className={`${isFormFieldValid(meta) && "p-error"}`}
                          >
                            First Name*
                          </label>
                        </span>
                        {getFormErrorMessage(meta)}
                      </div>
                    )}
                  />
                  <Field
                    name="LastName"
                    render={({ input, meta }) => (
                      <div className="field" style={{ width: "50%" }}>
                        <span className="p-float-label">
                          <InputText
                            id="LastName"
                            {...input}
                            className={` ${
                              isFormFieldValid(meta) && "p-invalid"
                            }`}
                          />
                          <label
                            htmlFor="LastName"
                            className={`${isFormFieldValid(meta) && "p-error"}`}
                          >
                            Last Name*
                          </label>
                        </span>
                        {getFormErrorMessage(meta)}
                      </div>
                    )}
                  />
                </div>

                <Field
                  name="Email"
                  render={({ input, meta }) => (
                    <div className="field">
                      <span className="p-float-label p-input-icon-right">
                        <i className="pi pi-envelope" />
                        <InputText
                          id="Email"
                          {...input}
                          className={`${isFormFieldValid(meta) && "p-invalid"}`}
                        />
                        <label
                          htmlFor="Email"
                          className={`${isFormFieldValid(meta) && "p-error"}`}
                        >
                          Email*
                        </label>
                      </span>
                      {getFormErrorMessage(meta)}
                    </div>
                  )}
                />
   <div className="flex">
  <Field
    name="CountryCode"
    render={({ input, meta }) => (
      <div className="field" style={{ width: '30%', marginRight: '1rem' }}>
        <span className="p-float-label">
          <Dropdown
            id="CountryCode"
            name="CountryCode"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.value)}
            options={countryCodes}
            placeholder="Country Code"
          />
          <label htmlFor="CountryCode">CC</label>
        </span>
        {getFormErrorMessage(meta)}
      </div>
    )}
  />

  <Field
    name="PhoneNumber"
    render={({ input, meta }) => (
      <div className="field" style={{ width: '70%', marginRight: '1rem' }}>
        <span className="p-float-label">
          <InputText
            type="tel"
            id="PhoneNumber"
            {...input}
            onInput={(e) => {
              let numericValue = e.target.value.replace(/\D/g, ''); // Allow only numeric input
              e.target.value = numericValue.slice(0, 10); // Truncate to a maximum of 10 digits
            }}
            pattern="[0-9]{10}"
            title="Please enter a valid 10-digit phone number."
            className={`${
              isFormFieldValid(meta) && "p-invalid"
            }`}
          />
          <label
            htmlFor="PhoneNumber"
            className={`${isFormFieldValid(meta) && "p-error"}`}
          >
            Phone Number*
          </label>
        </span>
        {getFormErrorMessage(meta)}
      </div>
    )}
  />
</div>





                {/* <Field
                  name="DateofBirth"
                  render={({ input }) => (
                    <div className="field">
                      <span className="p-float-label">
                        <Calendar
                          id="DateofBirth"
                          {...input}
                          dateFormat="dd/mm/yy"
                          mask="99/99/9999"
                          showIcon
                        />
                        <label htmlFor="DateofBirth">Date of Birth</label>
                      </span>
                    </div>
                  )}
                /> */}
                <Field
                  name="Address"
                  render={({ input, meta }) => (
                    <div className="field" style={{ width: "100%" }}>
                      <span className="p-float-label">
                        <InputText
                          id="Address"
                          {...input}
                          className={` ${
                            isFormFieldValid(meta) && "p-invalid"
                          }`}
                        />
                        <label
                          htmlFor="Address"
                          className={`${isFormFieldValid(meta) && "p-error"}`}
                        >
                          Address
                        </label>
                      </span>
                      {getFormErrorMessage(meta)}
                    </div>
                  )}
                />

                <Field
                  name="City"
                  render={({ input }) => (
                    <div className="field">
                      <span className="p-float-label">
                        <Dropdown
                          id="City"
                          options={cito}
                          
                          {...input}

                          
                          optionLabel="label"
                        />
                        <label htmlFor="City">City</label>
                      </span>
                    </div>
                  )}
                />
                <Field
                  name="CanadianStatus"
                  render={({ input }) => (
                    <div className="field">
                      <span className="p-float-label">
                        <CascadeSelect
                          id="CanadianStatus"
                          {...input}
                          value={selectedstats}
                          onChange={(e) => setSelectedstats(e.value)}
                          options={Status}
                          optionLabel="cname"
                          optionGroupLabel="name"
                          optionGroupChildren={["states", "cities"]}
                          className="w-full md:w-14rem"
                          breakpoint="767px"
                        
                          style={{ minWidth: "14rem" }}
                        />
                        <label htmlFor="CanadianStatus">Canadian Status</label>
                      </span>
                    </div>
                  )}
                />

                {(() => {
                  if (selectedstats && selectedstats.name === "Student") {
                    return (
                      <span className="one">
                        <Field
                          name="InstitutionName"
                          render={({ input }) => (
                            <div className="field">
                              <span className="p-float-label">
                                <Dropdown
                                  id="InstitutionName"
                                  options={collego}
                                  {...input}
                                  // filter
                                  optionLabel="label"
                                />
                                <label htmlFor="country">
                                  Institution Name
                                </label>
                              </span>
                            </div>
                          )}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                          <Field
                            name="CourseName"
                            render={({ input, meta }) => (
                              <div className="field" style={{ width: "50%" }}>
                                <span className="p-float-label">
                                  <InputText
                                    id="Cname"
                                    {...input}
                                    className={` ${
                                      isFormFieldValid(meta) && "p-invalid"
                                    }`}
                                  />
                                  <label
                                    htmlFor="Cname"
                                    className={`${
                                      isFormFieldValid(meta) && "p-error"
                                    }`}
                                  >
                                    Course Name*
                                  </label>
                                </span>
                                {getFormErrorMessage(meta)}
                              </div>
                            )}
                          />
                          <Field
                            name="ExpectedGraduation"
                            render={({ input, meta }) => (
                              <div className="field" style={{ width: "50%" }}>
                                <span className="p-float-label">
                                  <Calendar
                                  id="ExpectedGraduation"
                                  {...input}
                                    value={date}
                                    onChange={(e) => setDate(e.value)}
                                    view="month"
                                    dateFormat="mm/yy"
                                  />
                                  <label
                                    htmlFor="Gradyear"
                                    className={`${
                                      isFormFieldValid(meta) && "p-error"
                                    }`}
                                  >
                                    Expected Graduation*
                                  </label>
                                </span>
                                {getFormErrorMessage(meta)}
                              </div>
                            )}
                          />
                          
                        </div>
                      </span>
                      
                    );
                  } else if (
                    selectedstats &&
                    selectedstats.name !== "Student"
                  ) {
                    return (
                      <Field
                        name="Field"
                        render={({ input, meta }) => (
                          <div className="field" style={{ width: "100%" }}>
                            <span className="p-float-label">
                              <Dropdown
                                id="Field"
                                options={fieldsOptions}

                                placeholder="Select a Field"
                                optionLabel="label"

                                {...input}
                                filterBy="label"
                              />
                              <label
                                htmlFor="Field"
                                className={`${
                                  isFormFieldValid(meta) && "p-error"
                                }`}
                              >
                                Field*
                              </label>
                            </span>
                            {getFormErrorMessage(meta)}
                          </div>
                        )}
                      />

                      
                      
                    );
                  }
                })()}

                <Field
                  name="accept"
                  type="checkbox"
                  render={({ input, meta }) => (
                    <div className="field-checkbox">
                      <Checkbox
                        inputId="accept"
                        {...input}
                        className={`${isFormFieldValid(meta) && "p-invalid"}`}
                      />
                      <label
                        htmlFor="accept"
                        className={`${isFormFieldValid(meta) && "p-error"}`}
                      >
                        I agree to the terms and conditions*
                      </label>
                    </div>
                  )}
                />

                <Button
                  type="submit"
                  label="Submit"
                  className="mt-2"
                  value="submit"
                />
              </form>
            )}
          />
        </div>
      </div>
 {/* Footer */}
 <div className="footer">
        <div className="textsfoot">
       
        <li className="Fmail" >
  <a className="Fmail" href="mailto:coming2canada@samp.ca">
    <FontAwesomeIcon icon={faEnvelope} />
    &nbsp; coming2canada@samp.ca
  </a>
</li>

          <li className="FText">
  
  
  <a href="https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada/study-permit/prepare/designated-learning-institutions-list.html" className="FText">
    <FontAwesomeIcon icon={faGraduationCap} />
    &nbsp; Learning Institutes
  </a>
</li>

        </div>
        <img src="https://www.neasdentemple.org/footer/bapsLogo.png" alt="FooterImage" />
      </div>
    </div>
  );
};

const rootElement = document.getElementById("root");
const root = createRoot(rootElement); // Use createRoot instead of ReactDOM.render
root.render(<ReactFinalFormDemo />);
