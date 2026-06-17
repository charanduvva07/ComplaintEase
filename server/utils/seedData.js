require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const departments = [
  { name: 'Water & Sanitation', code: 'WS', description: 'Handles water supply and sanitation issues', categories: ['Water', 'Sanitation'], contactEmail: 'water@complaintease.com', contactPhone: '+1-555-0101' },
  { name: 'Electrical Department', code: 'ELEC', description: 'Manages electricity and power issues', categories: ['Electricity'], contactEmail: 'electric@complaintease.com', contactPhone: '+1-555-0102' },
  { name: 'IT & Digital Services', code: 'IT', description: 'Handles internet and technical issues', categories: ['Internet', 'Technical'], contactEmail: 'it@complaintease.com', contactPhone: '+1-555-0103' },
  { name: 'Roads & Infrastructure', code: 'ROADS', description: 'Manages roads and transport infrastructure', categories: ['Roads', 'Transport'], contactEmail: 'roads@complaintease.com', contactPhone: '+1-555-0104' },
  { name: 'Housing & Facilities', code: 'HOUSE', description: 'Handles hostel and housing issues', categories: ['Hostel'], contactEmail: 'housing@complaintease.com', contactPhone: '+1-555-0105' },
  { name: 'Academic Affairs', code: 'ACAD', description: 'Manages academic and educational issues', categories: ['Academic'], contactEmail: 'academic@complaintease.com', contactPhone: '+1-555-0106' },
  { name: 'General Services', code: 'GEN', description: 'Handles general and miscellaneous complaints', categories: ['Other'], contactEmail: 'general@complaintease.com', contactPhone: '+1-555-0107' },
];

const users = [
  { name: 'Admin User', email: 'admin@complaintease.com', password: 'Admin@123456', role: 'admin', isVerified: true, isActive: true },
  { name: 'John Staff', email: 'john.staff@complaintease.com', password: 'Staff@123456', role: 'staff', isVerified: true, isActive: true },
  { name: 'Sara Staff', email: 'sara.staff@complaintease.com', password: 'Staff@123456', role: 'staff', isVerified: true, isActive: true },
  { name: 'Mike Tech', email: 'mike.tech@complaintease.com', password: 'Staff@123456', role: 'staff', isVerified: true, isActive: true },
  { name: 'Alice Manager', email: 'alice.manager@complaintease.com', password: 'Staff@123456', role: 'staff', isVerified: true, isActive: true },
  { name: 'Bob Wilson', email: 'bob.wilson@gmail.com', password: 'User@123456', role: 'user', isVerified: true, isActive: true },
  { name: 'Emma Johnson', email: 'emma.johnson@gmail.com', password: 'User@123456', role: 'user', isVerified: true, isActive: true },
  { name: 'Carlos Rodriguez', email: 'carlos.r@gmail.com', password: 'User@123456', role: 'user', isVerified: true, isActive: true },
  { name: 'Priya Sharma', email: 'priya.sharma@gmail.com', password: 'User@123456', role: 'user', isVerified: true, isActive: true },
  { name: 'David Chen', email: 'david.chen@gmail.com', password: 'User@123456', role: 'user', isVerified: true, isActive: true },
  { name: 'Fatima Al-Hassan', email: 'fatima.h@gmail.com', password: 'User@123456', role: 'user', isVerified: true, isActive: true },
  { name: 'Tom Anderson', email: 'tom.anderson@gmail.com', password: 'User@123456', role: 'user', isVerified: true, isActive: true },
  { name: 'Lily Wang', email: 'lily.wang@gmail.com', password: 'User@123456', role: 'user', isVerified: true, isActive: true },
  { name: 'James Brown', email: 'james.brown@gmail.com', password: 'User@123456', role: 'user', isVerified: true, isActive: true },
  { name: 'Sofia Martinez', email: 'sofia.m@gmail.com', password: 'User@123456', role: 'user', isVerified: true, isActive: true },
];

const complaintTemplates = [
  { title: 'Water supply disruption in Block A', description: 'The water supply has been completely cut off in Block A for the past 3 days. Residents are facing severe difficulties in their daily routine. Multiple attempts to contact the local water authority have been unsuccessful.', category: 'Water', location: 'Block A, North Wing', urgency: 'Critical', status: 'In Progress', priority: 'Critical' },
  { title: 'Frequent power outages affecting work from home', description: 'We have been experiencing power cuts lasting 4-6 hours every day for the past week. This is severely affecting work-from-home employees and causing data loss on computers. The UPS systems are also getting overloaded.', category: 'Electricity', location: 'Residential Zone B', urgency: 'High', status: 'Assigned', priority: 'High' },
  { title: 'Pothole on Main Street causing accidents', description: 'There is a large pothole approximately 1.5 meters in diameter on Main Street near the traffic signal. Two motorcycles have already been in accidents this week. The pothole has been growing in size due to recent rainfall.', category: 'Roads', location: 'Main Street, Junction 5', urgency: 'High', status: 'Under Review', priority: 'High' },
  { title: 'Internet connectivity issues in library', description: 'The library internet has been running at less than 1 Mbps for the past two weeks, making it impossible to use online resources for research. Students are unable to access digital databases and online study materials.', category: 'Internet', location: 'Central Library, Ground Floor', urgency: 'Medium', status: 'Resolved', priority: 'Medium' },
  { title: 'Garbage not collected for 2 weeks', description: 'Our neighborhood garbage has not been collected for the past 14 days. The waste is piling up and causing health hazards and attracting rats and insects. The smell has become unbearable for residents.', category: 'Sanitation', location: 'Green Valley Colony', urgency: 'Critical', status: 'Submitted', priority: 'Critical' },
  { title: 'Bus route #42 cancelled without notice', description: 'Bus route #42 has not been operational for 5 days without any prior notice or alternative arrangement. This is the only public transport option for hundreds of daily commuters to the industrial area.', category: 'Transport', location: 'Central Bus Stop', urgency: 'High', status: 'Under Review', priority: 'High' },
  { title: 'Hostel bathroom facilities need urgent repair', description: 'Six out of ten bathroom stalls in the girls hostel are non-functional. The water heaters are broken and there is a severe shortage of hot water during winter. This situation is unacceptable for student residents.', category: 'Hostel', location: "Girls' Hostel, Block 3", urgency: 'High', status: 'In Progress', priority: 'High' },
  { title: 'Examination schedule conflicts with remedial classes', description: 'The newly published examination schedule has major conflicts with the already announced remedial classes for backlog students. This creates an impossible situation where students must choose between attending remedial sessions and their exams.', category: 'Academic', location: 'Examination Department', urgency: 'Medium', status: 'Submitted', priority: 'Medium' },
  { title: 'Server downtime affecting student portal', description: 'The student portal has been down for 48 hours during the registration deadline period. Students cannot register for courses or access their academic records. The help desk is not responding to tickets.', category: 'Technical', location: 'Online Portal - Student Services', urgency: 'Critical', status: 'Resolved', priority: 'Critical' },
  { title: 'Street lights non-functional in Sector 4', description: 'All street lights in Sector 4 have been non-functional for 3 weeks. The area becomes completely dark after sunset causing safety concerns especially for women and children. Multiple theft incidents have been reported.', category: 'Electricity', location: 'Sector 4, Residential Area', urgency: 'High', status: 'Assigned', priority: 'High' },
  { title: 'Water pipeline burst near Park Road', description: 'A major pipeline has burst near Park Road causing water wastage and road damage. The water has been flowing for 2 days and is now seeping into foundations of nearby buildings.', category: 'Water', location: 'Park Road, Near Gate 3', urgency: 'Critical', status: 'In Progress', priority: 'Critical' },
  { title: 'No internet in hostel rooms for 10 days', description: 'The hostel WiFi has been completely down for 10 days. Students are unable to attend online classes, submit assignments, or access online learning materials. This is directly affecting academic performance.', category: 'Internet', location: 'Boys Hostel Block B', urgency: 'High', status: 'Under Review', priority: 'High' },
  { title: 'Drainage overflow causing flooding', description: 'The main drainage channel is blocked and overflowing into residential streets. The flood water is 6-8 inches deep making it impossible for vehicles and pedestrians to pass safely.', category: 'Sanitation', location: 'Drainage Channel, Sector 7', urgency: 'Critical', status: 'Resolved', priority: 'Critical' },
  { title: 'Road marking faded making driving dangerous', description: 'Road lane markings and pedestrian crossings have completely faded on the highway bypass. Drivers are unable to identify lanes especially at night leading to near-miss accidents daily.', category: 'Roads', location: 'Highway Bypass, KM 12-15', urgency: 'Medium', status: 'Closed', priority: 'Medium' },
  { title: 'AC malfunction in computer lab during exams', description: 'The air conditioning system in Computer Lab 3 has been malfunctioning during exam season. The temperature is reaching 35°C which is causing students to feel unwell and affecting exam performance.', category: 'Technical', location: 'Computer Lab 3, Engineering Block', urgency: 'High', status: 'Submitted', priority: 'High' },
];

const statusToIndex = {
  'Submitted': 0,
  'Under Review': 1,
  'Assigned': 2,
  'In Progress': 3,
  'Resolved': 4,
  'Closed': 5,
  'Rejected': 6,
};

const getTimelineForStatus = (status, adminId) => {
  const statuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
  const idx = statusToIndex[status];
  return statuses
    .slice(0, idx + 1)
    .map((s, i) => ({
      status: s,
      message: getStatusMessage(s),
      updatedBy: i === 0 ? null : adminId,
      timestamp: new Date(Date.now() - (idx - i) * 2 * 24 * 3600000),
    }));
};

const getStatusMessage = (status) => {
  const messages = {
    'Submitted': 'Complaint submitted successfully',
    'Under Review': 'Complaint is being reviewed by our team',
    'Assigned': 'Complaint has been assigned to a staff member',
    'In Progress': 'Work has started on resolving your complaint',
    'Resolved': 'Your complaint has been resolved',
    'Closed': 'Complaint closed successfully',
  };
  return messages[status] || `Status updated to ${status}`;
};

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting seed...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Complaint.deleteMany({}),
      Comment.deleteMany({}),
      Notification.deleteMany({}),
      ActivityLog.deleteMany({}),
    ]);
    console.log('✅ Data cleared\n');

    // Create departments
    console.log('🏢 Creating departments...');
    const createdDepts = await Department.insertMany(departments);
    console.log(`✅ Created ${createdDepts.length} departments\n`);

    // Create users (passwords hashed by model)
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`✅ Created ${createdUsers.length} users\n`);

    const admin = createdUsers[0];
    const staff = createdUsers.slice(1, 5);
    const regularUsers = createdUsers.slice(5);

    // Assign staff to departments
    for (let i = 0; i < staff.length; i++) {
      const dept = createdDepts[i % createdDepts.length];
      staff[i].department = dept._id;
      await staff[i].save();
      await Department.findByIdAndUpdate(dept._id, {
        $push: { staff: staff[i]._id },
        head: i === 0 ? staff[i]._id : undefined,
      });
    }

    // Create complaints
    console.log('📋 Creating complaints...');
    const createdComplaints = [];

    for (let i = 0; i < complaintTemplates.length; i++) {
      const template = complaintTemplates[i];
      const user = regularUsers[i % regularUsers.length];
      const dept = createdDepts.find((d) => d.categories.includes(template.category)) || createdDepts[6];
      const assignedStaff = ['Assigned', 'In Progress', 'Resolved', 'Closed'].includes(template.status) ? staff[i % staff.length] : null;

      const complaint = new Complaint({
        title: template.title,
        description: template.description,
        category: template.category,
        department: dept._id,
        location: template.location,
        urgency: template.urgency,
        status: template.status,
        priority: template.priority,
        submittedBy: user._id,
        assignedTo: assignedStaff?._id || null,
        timeline: getTimelineForStatus(template.status, admin._id),
        activityLog: template.status !== 'Submitted' ? [
          {
            action: `Status updated to ${template.status}`,
            performedBy: admin._id,
            details: 'Updated by admin during processing',
            timestamp: new Date(Date.now() - 1 * 24 * 3600000),
          },
        ] : [],
        adminNotes: ['In Progress', 'Resolved', 'Closed'].includes(template.status) ? 'Being handled by the relevant department staff.' : '',
        resolutionNotes: ['Resolved', 'Closed'].includes(template.status) ? 'The issue has been fully addressed and resolved. Please verify and rate your experience.' : '',
        resolvedAt: ['Resolved', 'Closed'].includes(template.status) ? new Date(Date.now() - 2 * 24 * 3600000) : null,
        closedAt: template.status === 'Closed' ? new Date(Date.now() - 1 * 24 * 3600000) : null,
        createdAt: new Date(Date.now() - (15 - i) * 24 * 3600000),
      });

      // Fix complaint ID since it's generated in pre-save hook
      await complaint.save();
      createdComplaints.push(complaint);

      // Add rating for resolved/closed complaints
      if (['Resolved', 'Closed'].includes(template.status) && Math.random() > 0.3) {
        complaint.rating = {
          score: Math.floor(Math.random() * 2) + 4, // 4 or 5
          feedback: 'Great service! Issue resolved quickly.',
          ratedAt: new Date(),
        };
        await complaint.save();
      }

      // Update user stats
      await User.findByIdAndUpdate(user._id, {
        $inc: {
          'stats.totalComplaints': 1,
          'stats.resolvedComplaints': ['Resolved', 'Closed'].includes(template.status) ? 1 : 0,
        },
      });

      // Update dept stats
      await Department.findByIdAndUpdate(dept._id, {
        $inc: {
          'performance.totalComplaints': 1,
          'performance.resolvedComplaints': ['Resolved', 'Closed'].includes(template.status) ? 1 : 0,
        },
      });
    }
    console.log(`✅ Created ${createdComplaints.length} complaints\n`);

    // Create comments
    console.log('💬 Creating comments...');
    const commentsData = [
      { complaintIdx: 0, authorIdx: 0, content: 'We have received your complaint and assigned it to our water department. Our team will visit the site tomorrow.', isAdminReply: true },
      { complaintIdx: 0, authorIdx: 5, content: 'Thank you for the update. Please make sure to also check the water tank on the rooftop.', isAdminReply: false },
      { complaintIdx: 1, authorIdx: 1, content: 'Our electrical team has been notified and will inspect the area within 24 hours.', isAdminReply: true },
      { complaintIdx: 2, authorIdx: 0, content: 'This has been escalated to the Roads department. Repair work will begin within 48 hours.', isAdminReply: true },
      { complaintIdx: 3, authorIdx: 2, content: 'Network upgrade has been completed. Please test and confirm if the issue is resolved.', isAdminReply: true },
      { complaintIdx: 3, authorIdx: 7, content: 'Yes, the internet speed is now much better. Thank you!', isAdminReply: false },
      { complaintIdx: 8, authorIdx: 3, content: 'The server has been restored. All student portal services are back online.', isAdminReply: true },
      { complaintIdx: 8, authorIdx: 9, content: 'Confirmed, the portal is working now. I was able to complete my registration.', isAdminReply: false },
    ];

    for (const cd of commentsData) {
      const complaint = createdComplaints[cd.complaintIdx];
      const author = cd.isAdminReply ? staff[0] : regularUsers[cd.authorIdx - 5] || regularUsers[0];

      await Comment.create({
        complaintId: complaint._id,
        author: author._id,
        content: cd.content,
        isAdminReply: cd.isAdminReply,
        readBy: [{ user: author._id, readAt: new Date() }],
      });
    }
    console.log(`✅ Created ${commentsData.length} comments\n`);

    // Create notifications
    console.log('🔔 Creating notifications...');
    const notifData = [];
    for (let i = 0; i < Math.min(10, createdComplaints.length); i++) {
      const complaint = createdComplaints[i];
      const user = regularUsers[i % regularUsers.length];
      notifData.push({
        recipient: user._id,
        sender: admin._id,
        title: 'Complaint Status Updated',
        message: `Your complaint ${complaint.complaintId} has been updated`,
        type: 'status_changed',
        relatedComplaint: complaint._id,
        link: `/complaints/${complaint._id}`,
        isRead: Math.random() > 0.5,
      });
    }
    await Notification.insertMany(notifData);
    console.log(`✅ Created ${notifData.length} notifications\n`);

    console.log('\n════════════════════════════════════════════');
    console.log('✅ SEED DATA CREATED SUCCESSFULLY');
    console.log('════════════════════════════════════════════');
    console.log('\n📋 Login Credentials:');
    console.log('  👑 Admin:  admin@complaintease.com / Admin@123456');
    console.log('  🔧 Staff:  john.staff@complaintease.com / Staff@123456');
    console.log('  👤 User:   bob.wilson@gmail.com / User@123456');
    console.log('\n📊 Data Summary:');
    console.log(`  • ${createdDepts.length} Departments`);
    console.log(`  • ${createdUsers.length} Users (1 admin, 4 staff, 10 users)`);
    console.log(`  • ${createdComplaints.length} Complaints`);
    console.log(`  • ${commentsData.length} Comments`);
    console.log(`  • ${notifData.length} Notifications`);
    console.log('════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seed();
