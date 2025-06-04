const sampleJobs = [
    {
      title: "Senior Software Engineer",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      type: "FULL_TIME",
      salary: "$120,000 - $180,000",
      description: "We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing, developing, and maintaining high-quality software applications. The ideal candidate has strong experience with modern web technologies and a passion for building scalable solutions.",
      requirements: [
        "5+ years of software development experience",
        "Proficiency in JavaScript, React, and Node.js",
        "Experience with cloud platforms (AWS, GCP, or Azure)",
        "Strong problem-solving and communication skills",
        "Bachelor's degree in Computer Science or equivalent"
      ],
      benefits: [
        "Competitive salary and equity package",
        "Health, dental, and vision insurance",
        "Flexible work arrangements",
        "Professional development budget",
        "Free meals and snacks"
      ]
    },
    {
      title: "Product Manager",
      company: "InnovateLabs",
      location: "New York, NY",
      type: "FULL_TIME",
      salary: "$100,000 - $140,000",
      description: "Join our product team as a Product Manager and help shape the future of our digital products. You'll work closely with engineering, design, and business teams to define product requirements, prioritize features, and drive product strategy.",
      requirements: [
        "3+ years of product management experience",
        "Experience with agile development methodologies",
        "Strong analytical and data-driven decision making",
        "Excellent communication and leadership skills",
        "MBA or relevant advanced degree preferred"
      ],
      benefits: [
        "Stock options",
        "Comprehensive health coverage",
        "Unlimited PTO",
        "Remote work flexibility",
        "Learning and development stipend"
      ]
    },
    {
      title: "UX/UI Designer",
      company: "DesignStudio Pro",
      location: "Austin, TX",
      type: "FULL_TIME",
      salary: "$75,000 - $110,000",
      description: "We're seeking a talented UX/UI Designer to create intuitive and beautiful user experiences. You'll be responsible for the entire design process from user research to final implementation, working on both web and mobile applications.",
      requirements: [
        "3+ years of UX/UI design experience",
        "Proficiency in Figma, Sketch, or Adobe Creative Suite",
        "Strong portfolio demonstrating design thinking",
        "Experience with user research and usability testing",
        "Understanding of front-end development principles"
      ],
      benefits: [
        "Creative freedom and autonomy",
        "Top-tier design tools and equipment",
        "Health and wellness benefits",
        "Flexible working hours",
        "Conference and workshop attendance"
      ]
    },
    {
      title: "Data Scientist",
      company: "DataDriven Analytics",
      location: "Seattle, WA",
      type: "FULL_TIME",
      salary: "$110,000 - $160,000",
      description: "Join our data science team to extract insights from complex datasets and build predictive models. You'll work on machine learning projects that directly impact business decisions and help drive our company's growth.",
      requirements: [
        "Master's degree in Data Science, Statistics, or related field",
        "4+ years of experience in data analysis and machine learning",
        "Proficiency in Python, R, and SQL",
        "Experience with ML frameworks (TensorFlow, PyTorch, scikit-learn)",
        "Strong statistical analysis and modeling skills"
      ],
      benefits: [
        "Competitive salary and bonus structure",
        "Cutting-edge technology and tools",
        "Professional development opportunities",
        "Flexible remote work policy",
        "Health and retirement benefits"
      ]
    },
    {
      title: "Marketing Manager",
      company: "BrandBuilders Co.",
      location: "Chicago, IL",
      type: "FULL_TIME",
      salary: "$70,000 - $95,000",
      description: "Lead our marketing efforts and drive brand awareness across multiple channels. You'll develop and execute marketing campaigns, manage social media presence, and analyze campaign performance to optimize our marketing strategy.",
      requirements: [
        "4+ years of marketing experience",
        "Experience with digital marketing platforms (Google Ads, Facebook, LinkedIn)",
        "Strong content creation and copywriting skills",
        "Analytics experience (Google Analytics, HubSpot, etc.)",
        "Bachelor's degree in Marketing or related field"
      ],
      benefits: [
        "Performance-based bonuses",
        "Health and dental insurance",
        "Professional development budget",
        "Flexible PTO policy",
        "Team building events and perks"
      ]
    },
    {
      title: "DevOps Engineer",
      company: "CloudTech Solutions",
      location: "Denver, CO",
      type: "FULL_TIME",
      salary: "$95,000 - $135,000",
      description: "We're looking for a DevOps Engineer to help us build and maintain our cloud infrastructure. You'll work on automation, CI/CD pipelines, monitoring, and ensuring our systems are scalable, reliable, and secure.",
      requirements: [
        "3+ years of DevOps or infrastructure experience",
        "Experience with AWS, Docker, and Kubernetes",
        "Proficiency in scripting languages (Python, Bash, etc.)",
        "Knowledge of CI/CD tools (Jenkins, GitLab CI, GitHub Actions)",
        "Understanding of monitoring and logging tools"
      ],
      benefits: [
        "Competitive salary and equity",
        "Comprehensive benefits package",
        "Remote work opportunities",
        "Technology stipend",
        "Professional certification support"
      ]
    },
    {
      title: "Sales Representative",
      company: "SalesForce Pro",
      location: "Miami, FL",
      type: "FULL_TIME",
      salary: "$60,000 - $90,000 + Commission",
      description: "Join our dynamic sales team and help drive revenue growth by building relationships with potential clients. You'll be responsible for the entire sales cycle from lead generation to closing deals.",
      requirements: [
        "2+ years of B2B sales experience",
        "Proven track record of meeting sales targets",
        "Excellent communication and negotiation skills",
        "Experience with CRM systems (Salesforce, HubSpot)",
        "Self-motivated and results-oriented"
      ],
      benefits: [
        "Uncapped commission structure",
        "Base salary plus bonuses",
        "Health and wellness benefits",
        "Sales incentive trips",
        "Career advancement opportunities"
      ]
    },
    {
      title: "Content Writer",
      company: "ContentCraft Media",
      location: "Remote",
      type: "REMOTE",
      salary: "$45,000 - $65,000",
      description: "We're seeking a creative Content Writer to produce engaging content across various platforms. You'll write blog posts, social media content, email campaigns, and marketing materials that resonate with our target audience.",
      requirements: [
        "2+ years of content writing experience",
        "Excellent writing and editing skills",
        "Experience with SEO best practices",
        "Familiarity with content management systems",
        "Bachelor's degree in English, Journalism, or related field"
      ],
      benefits: [
        "100% remote work",
        "Flexible schedule",
        "Health insurance stipend",
        "Professional development opportunities",
        "Creative freedom and autonomy"
      ]
    },
    {
      title: "Customer Success Manager",
      company: "ClientFirst Solutions",
      location: "Boston, MA",
      type: "FULL_TIME",
      salary: "$65,000 - $85,000",
      description: "Help our clients achieve success with our platform as a Customer Success Manager. You'll onboard new customers, provide ongoing support, and work to ensure high customer satisfaction and retention rates.",
      requirements: [
        "3+ years of customer success or account management experience",
        "Strong interpersonal and communication skills",
        "Experience with SaaS platforms",
        "Problem-solving and analytical abilities",
        "Bachelor's degree preferred"
      ],
      benefits: [
        "Competitive salary and performance bonuses",
        "Comprehensive health benefits",
        "Professional growth opportunities",
        "Flexible work arrangements",
        "Employee recognition programs"
      ]
    },
    {
      title: "Quality Assurance Engineer",
      company: "TestRight Technologies",
      location: "Portland, OR",
      type: "FULL_TIME",
      salary: "$70,000 - $100,000",
      description: "Ensure the quality of our software products as a QA Engineer. You'll design and execute test plans, identify bugs, and work closely with development teams to maintain high standards of software quality.",
      requirements: [
        "3+ years of QA or testing experience",
        "Experience with automated testing tools and frameworks",
        "Knowledge of testing methodologies and best practices",
        "Familiarity with bug tracking systems (Jira, Bugzilla)",
        "Attention to detail and analytical mindset"
      ],
      benefits: [
        "Competitive salary",
        "Health, dental, and vision insurance",
        "Professional development budget",
        "Flexible working hours",
        "Team collaboration and learning environment"
      ]
    }
  ];


// Function to create a sample employer user and jobs
async function seedJobs() {
    const API_BASE = 'http://localhost:3000/api';
    
    try {
      // First, create a sample employer account
      const employerData = {
        name: "AKT Talents Admin",
        email: "admin@AKT Talents.com",
        password: "password123",
        role: "EMPLOYER"
      };
  
      console.log('Creating sample employer account...');
      const employerResponse = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employerData)
      });
  
      let employerId;
      if (employerResponse.ok) {
        const employerResult = await employerResponse.json();
        employerId = employerResult.user.id;
        console.log('✅ Sample employer created with ID:', employerId);
      } else {
        // If employer already exists, try to login to get ID
        console.log('Employer might already exist, attempting login...');
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: employerData.email,
            password: employerData.password
          })
        });
        
        if (loginResponse.ok) {
          const loginResult = await loginResponse.json();
          employerId = loginResult.user.id;
          console.log('✅ Using existing employer with ID:', employerId);
        } else {
          throw new Error('Could not create or login employer');
        }
      }
  
      // Create jobs
      console.log('\nCreating sample jobs...');
      let successCount = 0;
      
      for (let i = 0; i < sampleJobs.length; i++) {
        const job = { ...sampleJobs[i], employerId };
        
        try {
          const response = await fetch(`${API_BASE}/jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(job)
          });
  
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Created job: ${result.title} at ${result.company}`);
            successCount++;
          } else {
            const error = await response.json();
            console.log(`❌ Failed to create job: ${job.title} - ${error.message}`);
          }
        } catch (error) {
          console.log(`❌ Error creating job: ${job.title} - ${error.message}`);
        }
      }
  
      console.log(`\n🎉 Successfully created ${successCount} out of ${sampleJobs.length} jobs!`);
      console.log('\nYou can now:');
      console.log('1. Visit http://localhost:3000/jobs to see the job listings');
      console.log('2. Login as employer with: admin@AKT Talents.com / password123');
      console.log('3. View the employer dashboard to manage these jobs');
      
    } catch (error) {
      console.error('❌ Error seeding jobs:', error.message);
    }
  }
  
  // Export for use as a module or run directly
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { seedJobs, sampleJobs };
  } else {
    // Browser environment - add to window
    window.seedJobs = seedJobs;
  }
  
  // If running directly with Node.js
  if (typeof require !== 'undefined' && require.main === module) {
    seedJobs();
  }
  