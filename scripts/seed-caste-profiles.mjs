#!/usr/bin/env node
/**
 * Seed matrimonial profiles — per STATE + caste/community, balanced male + female.
 *
 * • Har Indian state ke liye us state ki castes/communities se profiles
 * • Pan India castes → har state me; North East → saare NE states me
 * • ~100–110 profiles per gender per (state × caste)
 * • Unique mobile, real Indian names by state, full profile, NO photos
 *
 * Usage:
 *   node scripts/seed-caste-profiles.mjs --religions Hindu
 *   node scripts/seed-caste-profiles.mjs --state Gujarat
 *   node scripts/seed-caste-profiles.mjs --dry-run
 *
 * Password for all seeded users: 12345678
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID, randomInt } from 'crypto';
import { getCastesByReligion, INDIAN_STATES_UTS } from '../lib/casteData.js';

const envFile = existsSync('.env.production') ? '.env.production' : '.env';
config({ path: envFile });

const PASSWORD_PLAIN = '12345678';
const SKIP_CASTE_VALUES = new Set([
  "Doesn't Matter",
  'Inter-Caste / Inter-Community',
  'Inter-Community',
  'Prefer Not to Say',
]);

/** Caste data regions → app state names */
const REGION_TO_STATE = {
  Delhi: 'Delhi NCR',
};

const NORTH_EAST_STATES = [
  'Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Tripura', 'Sikkim',
];

// ─── Name banks (real Indian names, region-aware) ───────────────────────────

const GOTRAS = ['Bharadwaj', 'Kashyap', 'Vashishtha', 'Gautam', 'Agastya', 'Atri', 'Angiras', 'Pulastya', 'Garg', 'Kaushik', 'Parashar', 'Shandilya'];

const NAMES_BY_REGION = {
  'Uttar Pradesh': {
    male: ['Aarav', 'Rohit', 'Amit', 'Rahul', 'Vikas', 'Nitin', 'Suresh', 'Manoj', 'Deepak', 'Arjun', 'Karan', 'Harsh', 'Yash', 'Ankit', 'Kunal', 'Ravi', 'Sanjay', 'Naveen', 'Gaurav', 'Pankaj'],
    female: ['Priya', 'Anjali', 'Neha', 'Pooja', 'Kavita', 'Sneha', 'Ritu', 'Meera', 'Divya', 'Shreya', 'Kiran', 'Nisha', 'Swati', 'Tanvi', 'Isha', 'Palak', 'Simran', 'Kavya', 'Riya', 'Sakshi'],
    last: ['Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Yadav', 'Thakur', 'Mishra', 'Pandey', 'Tiwari', 'Shukla', 'Agarwal', 'Saxena', 'Dubey', 'Tripathi', 'Chauhan', 'Rathore', 'Tomar', 'Bisen', 'Maurya'],
  },
  Bihar: {
    male: ['Rajesh', 'Manoj', 'Sanjay', 'Vijay', 'Rakesh', 'Sunil', 'Anil', 'Pankaj', 'Naveen', 'Prakash', 'Dinesh', 'Ashok', 'Mukesh', 'Ravi', 'Suresh'],
    female: ['Priya', 'Anjali', 'Neha', 'Pooja', 'Kavita', 'Ritu', 'Sunita', 'Rekha', 'Geeta', 'Manisha', 'Poonam', 'Shilpa', 'Madhu', 'Smita', 'Preeti'],
    last: ['Yadav', 'Singh', 'Kumar', 'Sharma', 'Verma', 'Gupta', 'Mishra', 'Pandey', 'Thakur', 'Rai', 'Choudhary', 'Prasad', 'Jha', 'Sinha', 'Srivastava'],
  },
  Rajasthan: {
    male: ['Vikram', 'Rathore', 'Suresh', 'Mahendra', 'Bhagwan', 'Gopal', 'Lalit', 'Man Singh', 'Pratap', 'Rakesh', 'Sunil', 'Ashok', 'Rajesh', 'Naresh', 'Dinesh'],
    female: ['Priya', 'Kavita', 'Poonam', 'Sunita', 'Manisha', 'Rekha', 'Geeta', 'Anju', 'Suman', 'Neelam', 'Ritu', 'Shobha', 'Meena', 'Lata', 'Usha'],
    last: ['Singh', 'Rathore', 'Chauhan', 'Rajput', 'Meena', 'Jat', 'Yadav', 'Sharma', 'Agarwal', 'Maheshwari', 'Bohra', 'Soni', 'Kumawat', 'Gurjar', 'Pareek'],
  },
  Odisha: {
    male: ['Pradeep', 'Santosh', 'Bijay', 'Subhash', 'Manoj', 'Ramesh', 'Suresh', 'Dilip', 'Prafulla', 'Niranjan', 'Ashok', 'Debasish', 'Surya', 'Biswa', 'Tapas'],
    female: ['Priya', 'Smita', 'Basanti', 'Sasmita', 'Lipsa', 'Subhashini', 'Manasi', 'Itishri', 'Ananya', 'Barsha', 'Sonali', 'Rashmi', 'Pallabi', 'Sangita', 'Archana'],
    last: ['Mohanty', 'Pattnaik', 'Das', 'Rout', 'Sahoo', 'Behera', 'Pradhan', 'Mishra', 'Nayak', 'Swain', 'Parida', 'Jena', 'Tripathy', 'Samal', 'Panda'],
  },
  Assam: {
    male: ['Raju', 'Bikash', 'Dipankar', 'Pranab', 'Hiren', 'Manoj', 'Rabin', 'Utpal', 'Jyoti', 'Babul', 'Tarun', 'Bhaskar', 'Arun', 'Sanjay', 'Nirmal'],
    female: ['Priya', 'Anjana', 'Madhurima', 'Jyotika', 'Rimpi', 'Mousumi', 'Archana', 'Barnali', 'Pallavi', 'Nilakshi', 'Manisha', 'Swapna', 'Rina', 'Kabita', 'Anjali'],
    last: ['Das', 'Bora', 'Saikia', 'Baruah', 'Hazarika', 'Kalita', 'Gogoi', 'Barman', 'Phukan', 'Deka', 'Choudhury', 'Sharma', 'Singh', 'Ahmed', 'Ali'],
  },
  Haryana: {
    male: ['Suresh', 'Rajesh', 'Sunil', 'Anil', 'Vijay', 'Ramesh', 'Dinesh', 'Manoj', 'Sanjay', 'Naveen', 'Amit', 'Rahul', 'Vikas', 'Deepak', 'Harish'],
    female: ['Priya', 'Neha', 'Pooja', 'Kavita', 'Sunita', 'Manisha', 'Rekha', 'Geeta', 'Anju', 'Suman', 'Ritu', 'Swati', 'Nisha', 'Preeti', 'Anjali'],
    last: ['Yadav', 'Singh', 'Jat', 'Malik', 'Punia', 'Dalal', 'Ahlawat', 'Sangwan', 'Rathi', 'Bishnoi', 'Kadian', 'Sheoran', 'Phogat', 'Hooda', 'Chautala'],
  },
  'Madhya Pradesh': {
    male: ['Rajesh', 'Sunil', 'Anil', 'Suresh', 'Manoj', 'Sanjay', 'Vijay', 'Ramesh', 'Dinesh', 'Ashok', 'Mukesh', 'Pradeep', 'Naveen', 'Amit', 'Rahul'],
    female: ['Priya', 'Anjali', 'Neha', 'Pooja', 'Kavita', 'Sunita', 'Rekha', 'Geeta', 'Manisha', 'Ritu', 'Swati', 'Nisha', 'Preeti', 'Divya', 'Shreya'],
    last: ['Patel', 'Sharma', 'Verma', 'Singh', 'Yadav', 'Kushwaha', 'Kurmi', 'Rajput', 'Thakur', 'Ahirwar', 'Ahir', 'Gond', 'Korku', 'Bhil', 'Malviya'],
  },
  Jharkhand: {
    male: ['Rajesh', 'Manoj', 'Sanjay', 'Vijay', 'Rakesh', 'Sunil', 'Anil', 'Pankaj', 'Naveen', 'Prakash', 'Dinesh', 'Ashok', 'Mukesh', 'Ravi', 'Suresh'],
    female: ['Priya', 'Anjali', 'Neha', 'Pooja', 'Kavita', 'Ritu', 'Sunita', 'Rekha', 'Geeta', 'Manisha', 'Poonam', 'Shilpa', 'Madhu', 'Smita', 'Preeti'],
    last: ['Munda', 'Oraon', 'Soren', 'Hembram', 'Singh', 'Yadav', 'Kumar', 'Sharma', 'Verma', 'Gupta', 'Mishra', 'Toppo', 'Bedia', 'Karmakar', 'Mahato'],
  },
  Chhattisgarh: {
    male: ['Rajesh', 'Sunil', 'Anil', 'Suresh', 'Manoj', 'Sanjay', 'Vijay', 'Ramesh', 'Dinesh', 'Ashok', 'Mukesh', 'Pradeep', 'Naveen', 'Amit', 'Rahul'],
    female: ['Priya', 'Anjali', 'Neha', 'Pooja', 'Kavita', 'Sunita', 'Rekha', 'Geeta', 'Manisha', 'Ritu', 'Swati', 'Nisha', 'Preeti', 'Divya', 'Shreya'],
    last: ['Sahu', 'Patel', 'Yadav', 'Kurmi', 'Verma', 'Sharma', 'Singh', 'Kumar', 'Gond', 'Satnami', 'Dhruv', 'Kashyap', 'Nag', 'Thakur', 'Rajput'],
  },
  Uttarakhand: {
    male: ['Rajesh', 'Sunil', 'Anil', 'Suresh', 'Manoj', 'Sanjay', 'Vijay', 'Ramesh', 'Dinesh', 'Deepak', 'Naveen', 'Amit', 'Rahul', 'Vikas', 'Harish'],
    female: ['Priya', 'Anjali', 'Neha', 'Pooja', 'Kavita', 'Sunita', 'Rekha', 'Geeta', 'Manisha', 'Ritu', 'Swati', 'Nisha', 'Preeti', 'Divya', 'Shreya'],
    last: ['Rawat', 'Bisht', 'Negi', 'Bhandari', 'Pant', 'Nautiyal', 'Rana', 'Bhandari', 'Sharma', 'Singh', 'Gusain', 'Semwal', 'Kukreti', 'Uniyal', 'Bahuguna'],
  },
  'Himachal Pradesh': {
    male: ['Rajesh', 'Sunil', 'Anil', 'Suresh', 'Manoj', 'Sanjay', 'Vijay', 'Ramesh', 'Dinesh', 'Deepak', 'Naveen', 'Amit', 'Rahul', 'Vikas', 'Harish'],
    female: ['Priya', 'Anjali', 'Neha', 'Pooja', 'Kavita', 'Sunita', 'Rekha', 'Geeta', 'Manisha', 'Ritu', 'Swati', 'Nisha', 'Preeti', 'Divya', 'Shreya'],
    last: ['Sharma', 'Verma', 'Singh', 'Thakur', 'Rana', 'Chauhan', 'Negi', 'Katoch', 'Jaswal', 'Pathania', 'Bhardwaj', 'Sood', 'Kapoor', 'Mehta', 'Khanna'],
  },
  Goa: {
    male: ['Rohan', 'Neal', 'Cyril', 'Francis', 'Joseph', 'Anthony', 'Claude', 'Vincent', 'Michael', 'Peter', 'Paul', 'John', 'David', 'Simon', 'Thomas'],
    female: ['Maria', 'Grace', 'Lucia', 'Cecilia', 'Angela', 'Fatima', 'Savita', 'Reena', 'Sonia', 'Priscilla', 'Olivia', 'Natasha', 'Melissa', 'Sharon', 'Veronica'],
    last: ['Fernandes', 'D\'Souza', 'Pereira', 'Rodrigues', 'Costa', 'Gomes', 'Alvares', 'Mascarenhas', 'Pinto', 'Lobo', 'Naik', 'Kamat', 'Shetty', 'Parab', 'Kulkarni'],
  },
  'Delhi NCR': {
    male: ['Aarav', 'Rohit', 'Amit', 'Rahul', 'Vikas', 'Nitin', 'Suresh', 'Manoj', 'Deepak', 'Arjun', 'Karan', 'Harsh', 'Yash', 'Ankit', 'Kunal'],
    female: ['Priya', 'Anjali', 'Neha', 'Pooja', 'Kavita', 'Sneha', 'Ritu', 'Meera', 'Divya', 'Shreya', 'Kiran', 'Nisha', 'Swati', 'Tanvi', 'Isha'],
    last: ['Sharma', 'Verma', 'Singh', 'Gupta', 'Malhotra', 'Kapoor', 'Chopra', 'Bhatia', 'Saxena', 'Aggarwal', 'Khanna', 'Anand', 'Mehta', 'Jain', 'Arora'],
  },
  'Jammu & Kashmir': {
    male: ['Aadil', 'Imran', 'Farooq', 'Bashir', 'Riyaz', 'Altaf', 'Nadeem', 'Shabir', 'Manzoor', 'Ashiq', 'Rajesh', 'Sunil', 'Amit', 'Rahul', 'Vikas'],
    female: ['Fatima', 'Nazia', 'Rubina', 'Shabana', 'Ayesha', 'Priya', 'Anjali', 'Neha', 'Pooja', 'Kavita', 'Ritu', 'Meera', 'Divya', 'Shreya', 'Kiran'],
    last: ['Dar', 'Bhat', 'Wani', 'Lone', 'Mir', 'Khan', 'Shah', 'Pandit', 'Sharma', 'Kaul', 'Rainaa', 'Malik', 'Hussain', 'Rather', 'Naikoo'],
  },
  Ladakh: {
    male: ['Tsering', 'Stanzin', 'Namgyal', 'Rinchen', 'Tashi', 'Sonam', 'Dorje', 'Phuntsok', 'Angchuk', 'Rigzin', 'Rajesh', 'Sunil', 'Amit', 'Rahul', 'Vikas'],
    female: ['Diskit', 'Yangchen', 'Stanzin', 'Tsering', 'Sonam', 'Chuskit', 'Priya', 'Anjali', 'Neha', 'Pooja', 'Kavita', 'Ritu', 'Meera', 'Divya', 'Shreya'],
    last: ['Namgyal', 'Stanzin', 'Wangchuk', 'Lobzang', 'Rinchen', 'Sharma', 'Singh', 'Khan', 'Ali', 'Bhat', 'Zangpo', 'Angmo', 'Dorje', 'Rigzin', 'Phuntsok'],
  },
  Gujarat: {
    male: ['Harsh', 'Jay', 'Meet', 'Dhruv', 'Chirag', 'Hiren', 'Nikhil', 'Parth', 'Keval', 'Mitul', 'Hardik', 'Bhavin', 'Jignesh', 'Alpesh', 'Vishal'],
    female: ['Kinjal', 'Disha', 'Hetvi', 'Mansi', 'Khushi', 'Drashti', 'Bhumi', 'Krupa', 'Jinal', 'Hiral', 'Nidhi', 'Krishna', 'Payal', 'Riddhi', 'Shruti'],
    last: ['Patel', 'Shah', 'Desai', 'Mehta', 'Joshi', 'Parmar', 'Solanki', 'Thakkar', 'Modi', 'Gandhi', 'Chavda', 'Rathod', 'Makwana', 'Prajapati', 'Barot'],
  },
  Maharashtra: {
    male: ['Sachin', 'Prakash', 'Santosh', 'Ganesh', 'Vishwas', 'Swapnil', 'Onkar', 'Siddharth', 'Abhijit', 'Nilesh', 'Mahesh', 'Rohan', 'Tejas', 'Akshay', 'Sagar'],
    female: ['Snehal', 'Vaishali', 'Supriya', 'Archana', 'Swati', 'Pallavi', 'Sayali', 'Tejaswini', 'Rashmi', 'Sonali', 'Prachi', 'Aarti', 'Vidya', 'Madhuri', 'Komal'],
    last: ['Patil', 'Kulkarni', 'Deshpande', 'Jadhav', 'Pawar', 'Shinde', 'More', 'Gaikwad', 'Bhosale', 'Chavan', 'Joshi', 'Naik', 'Kadam', 'Mane', 'Salunkhe'],
  },
  'Tamil Nadu': {
    male: ['Arun', 'Karthik', 'Suresh', 'Murali', 'Prakash', 'Venkat', 'Senthil', 'Murugan', 'Balaji', 'Ganesh', 'Ramesh', 'Selvam', 'Kumar', 'Dinesh', 'Harish'],
    female: ['Lakshmi', 'Priya', 'Divya', 'Meena', 'Kavitha', 'Anitha', 'Malathi', 'Revathi', 'Deepa', 'Vijayalakshmi', 'Sangeetha', 'Nithya', 'Padmini', 'Shanthi', 'Geetha'],
    last: ['Iyer', 'Iyengar', 'Pillai', 'Natarajan', 'Ramachandran', 'Subramanian', 'Krishnan', 'Venkatesh', 'Sundaram', 'Rajan', 'Murthy', 'Gopal', 'Narayanan', 'Chidambaram', 'Srinivasan'],
  },
  Kerala: {
    male: ['Anoop', 'Sreejith', 'Renjith', 'Vishnu', 'Arun', 'Jithin', 'Sajan', 'Manu', 'Biju', 'Sandeep', 'Rajan', 'Unni', 'Vijay', 'Shyam', 'Girish'],
    female: ['Anu', 'Reshma', 'Deepa', 'Lekha', 'Sreeja', 'Parvathy', 'Meera', 'Asha', 'Smitha', 'Remya', 'Sindhu', 'Gayathri', 'Nisha', 'Raji', 'Soumya'],
    last: ['Nair', 'Menon', 'Pillai', 'Kurup', 'Panicker', 'Varma', 'Unni', 'Kaimal', 'Thampi', 'Nambiar', 'Warrier', 'Krishnan', 'Shenoy', 'Balakrishnan', 'Raj'],
  },
  Karnataka: {
    male: ['Raghavendra', 'Shivakumar', 'Manjunath', 'Prasad', 'Girish', 'Naveen', 'Harish', 'Srinivas', 'Vijay', 'Rajesh', 'Kumar', 'Anil', 'Sunil', 'Ravi', 'Shankar'],
    female: ['Lakshmi', 'Savitha', 'Shwetha', 'Anitha', 'Bhavya', 'Chaitra', 'Deepa', 'Geetha', 'Hema', 'Jyothi', 'Kavitha', 'Manjula', 'Nandini', 'Pooja', 'Radha'],
    last: ['Gowda', 'Hegde', 'Shetty', 'Rao', 'Murthy', 'Reddy', 'Naik', 'Kulkarni', 'Bhat', 'Kamath', 'Pai', 'Acharya', 'Adiga', 'Ballal', 'Devadiga'],
  },
  Punjab: {
    male: ['Harpreet', 'Gurpreet', 'Manpreet', 'Jaspreet', 'Amandeep', 'Navdeep', 'Rajveer', 'Simranjit', 'Gurmeet', 'Balwinder', 'Kuldeep', 'Ranjit', 'Sukhwinder', 'Parminder', 'Lovepreet'],
    female: ['Harleen', 'Jasleen', 'Navneet', 'Manpreet', 'Gurleen', 'Simran', 'Kiran', 'Navjot', 'Ramandeep', 'Baljeet', 'Parveen', 'Kamalpreet', 'Rajinder', 'Amrit', 'Gurpreet'],
    last: ['Singh', 'Kaur', 'Gill', 'Dhillon', 'Sandhu', 'Brar', 'Sidhu', 'Bajwa', 'Cheema', 'Grewal', 'Saini', 'Khatri', 'Arora', 'Sethi', 'Anand'],
  },
  'West Bengal': {
    male: ['Arindam', 'Subhash', 'Debashis', 'Sourav', 'Anirban', 'Prasenjit', 'Amitava', 'Biplab', 'Dipankar', 'Rajat', 'Soumitra', 'Indrajit', 'Partha', 'Suman', 'Tapas'],
    female: ['Mousumi', 'Rituparna', 'Debjani', 'Soma', 'Ananya', 'Payel', 'Rimi', 'Sohini', 'Tania', 'Madhumita', 'Poulomi', 'Sharmila', 'Tanushree', 'Urmi', 'Barnali'],
    last: ['Banerjee', 'Chatterjee', 'Mukherjee', 'Das', 'Ghosh', 'Bose', 'Sen', 'Roy', 'Dutta', 'Sarkar', 'Mondal', 'Kar', 'Pal', 'Bagchi', 'Bhattacharya'],
  },
  'Andhra Pradesh': {
    male: ['Srinivas', 'Venkatesh', 'Ramesh', 'Suresh', 'Nagesh', 'Prasad', 'Kiran', 'Rajesh', 'Mahesh', 'Gopal', 'Anil', 'Sunil', 'Ravi', 'Harish', 'Sai'],
    female: ['Lakshmi', 'Sravani', 'Swathi', 'Anusha', 'Padma', 'Sindhu', 'Keerthi', 'Harika', 'Sneha', 'Madhavi', 'Vijaya', 'Sunitha', 'Radha', 'Jyothi', 'Suma'],
    last: ['Reddy', 'Rao', 'Naidu', 'Chowdary', 'Kumar', 'Prasad', 'Murthy', 'Sharma', 'Goud', 'Varma', 'Kamma', 'Kapu', 'Velama', 'Balija', 'Golla'],
  },
  Telangana: {
    male: ['Srinivas', 'Venkatesh', 'Ramesh', 'Suresh', 'Nagesh', 'Prasad', 'Kiran', 'Rajesh', 'Mahesh', 'Gopal', 'Anil', 'Sunil', 'Ravi', 'Harish', 'Sai'],
    female: ['Lakshmi', 'Sravani', 'Swathi', 'Anusha', 'Padma', 'Sindhu', 'Keerthi', 'Harika', 'Sneha', 'Madhavi', 'Vijaya', 'Sunitha', 'Radha', 'Jyothi', 'Suma'],
    last: ['Reddy', 'Rao', 'Naidu', 'Chowdary', 'Kumar', 'Prasad', 'Murthy', 'Sharma', 'Goud', 'Varma', 'Kamma', 'Kapu', 'Velama', 'Balija', 'Golla'],
  },
  Muslim: {
    male: ['Mohammed', 'Ahmed', 'Imran', 'Salman', 'Farhan', 'Arif', 'Rizwan', 'Shahid', 'Asif', 'Nadeem', 'Faisal', 'Zaid', 'Hamza', 'Yusuf', 'Irfan', 'Khalid', 'Tariq', 'Wasim', 'Adil', 'Junaid'],
    female: ['Fatima', 'Ayesha', 'Zainab', 'Sana', 'Nazia', 'Rubina', 'Shabana', 'Farah', 'Hina', 'Saba', 'Nida', 'Amreen', 'Tabassum', 'Rukhsar', 'Samina', 'Khadija', 'Maryam', 'Noor', 'Salma', 'Yasmin'],
    last: ['Khan', 'Sheikh', 'Ansari', 'Qureshi', 'Syed', 'Pathan', 'Malik', 'Hussain', 'Ali', 'Rizvi', 'Hashmi', 'Siddiqui', 'Mirza', 'Farooqui', 'Usmani'],
  },
  Sikh: {
    male: ['Harpreet', 'Gurpreet', 'Manpreet', 'Jaspreet', 'Amandeep', 'Navdeep', 'Rajveer', 'Gurmeet', 'Balwinder', 'Kuldeep', 'Ranjit', 'Sukhwinder', 'Parminder', 'Lovepreet', 'Simranjit'],
    female: ['Harleen', 'Jasleen', 'Navneet', 'Gurleen', 'Simran', 'Kiran', 'Navjot', 'Ramandeep', 'Baljeet', 'Parveen', 'Kamalpreet', 'Rajinder', 'Amrit', 'Gurpreet', 'Manpreet'],
    last: ['Singh', 'Kaur', 'Gill', 'Dhillon', 'Sandhu', 'Brar', 'Sidhu', 'Bajwa', 'Cheema', 'Grewal', 'Saini', 'Bhatia', 'Sethi', 'Anand', 'Khanna'],
  },
  default: {
    male: ['Aarav', 'Rohit', 'Amit', 'Rahul', 'Vikas', 'Nitin', 'Suresh', 'Manoj', 'Deepak', 'Arjun', 'Karan', 'Harsh', 'Yash', 'Ankit', 'Kunal', 'Ravi', 'Sanjay', 'Naveen', 'Gaurav', 'Pankaj'],
    female: ['Priya', 'Anjali', 'Neha', 'Pooja', 'Kavita', 'Sneha', 'Ritu', 'Meera', 'Divya', 'Shreya', 'Kiran', 'Nisha', 'Swati', 'Tanvi', 'Isha'],
    last: ['Sharma', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Yadav', 'Thakur', 'Mishra', 'Pandey', 'Tiwari', 'Shukla', 'Agarwal', 'Saxena', 'Dubey', 'Tripathi'],
  },
};

const STATE_CITIES = {
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida', 'Ghaziabad', 'Prayagraj', 'Meerut'],
  Bihar: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain'],
  Chhattisgarh: ['Raipur', 'Bilaspur', 'Durg', 'Bhilai'],
  Rajasthan: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
  Gujarat: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  Maharashtra: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Kolhapur'],
  Goa: ['Panaji', 'Margao', 'Vasco da Gama'],
  Punjab: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Mohali'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi'],
  'Jammu & Kashmir': ['Srinagar', 'Jammu', 'Anantnag'],
  Uttarakhand: ['Dehradun', 'Haridwar', 'Haldwani', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol'],
  Odisha: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Puri'],
  Assam: ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli'],
  Kerala: ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kannur'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Hubballi', 'Belagavi'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati'],
  Telangana: ['Hyderabad', 'Warangal', 'Karimnagar', 'Nizamabad'],
  Haryana: ['Gurgaon', 'Faridabad', 'Panipat', 'Rohtak', 'Hisar'],
  Jharkhand: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro'],
  Delhi: ['New Delhi', 'Dwarka', 'Rohini', 'Karol Bagh'],
  'Delhi NCR': ['New Delhi', 'Noida', 'Gurgaon', 'Faridabad', 'Ghaziabad'],
  Manipur: ['Imphal'],
  Tripura: ['Agartala'],
  'Arunachal Pradesh': ['Itanagar'],
  Nagaland: ['Kohima', 'Dimapur'],
  Meghalaya: ['Shillong'],
  Mizoram: ['Aizawl'],
  Sikkim: ['Gangtok', 'Namchi', 'Gyalshing'],
  Ladakh: ['Leh', 'Kargil', 'Nubra'],
  Puducherry: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
  Chandigarh: ['Chandigarh', 'Manimajra', 'Sector 17'],
  'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Pasighat', 'Ziro'],
  Meghalaya: ['Shillong', 'Tura', 'Jowai', 'Nongstoin'],
  Mizoram: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip'],
  Manipur: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur'],
  Tripura: ['Agartala', 'Udaipur', 'Dharmanagar', 'Kailashahar'],
  Nagaland: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang'],
};

const EDUCATIONS = ["High School", "Diploma", "Bachelor's", "Master's", 'CA', 'MBBS', 'B.Tech', 'M.Tech', 'B.Com', 'M.Com', 'LLB', 'PhD', 'B.Sc', 'M.Sc', 'BBA', 'MBA'];
const PROFESSIONS = [
  'Software Engineer', 'Doctor', 'Teacher', 'Business Owner', 'Accountant', 'Bank Manager',
  'Government Employee', 'Architect', 'Lawyer', 'Marketing Manager', 'HR Manager', 'Pharmacist',
  'Nurse', 'Designer', 'Consultant', 'Sales Manager', 'Civil Engineer', 'Professor',
  'Chartered Accountant', 'Data Analyst', 'Electrician Contractor', 'Shop Owner', 'Farmer',
  'Police Officer', 'Army Personnel', 'Journalist', 'Photographer', 'Chef', 'Interior Designer',
];
const INCOMES = ['₹2-5 Lakh', '₹5-8 Lakh', '₹8-12 Lakh', '₹12-20 Lakh', '₹20-35 Lakh', '₹35-50 Lakh', '₹50 Lakh+'];
const DIETS = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan', 'Jain Vegetarian'];
const COMPLEXIONS = ['Fair', 'Wheatish', 'Medium', 'Dark'];
const BODY_TYPES = ['Slim', 'Average', 'Athletic', 'Heavy'];
const FAMILY_TYPES = ['Nuclear', 'Joint'];
const FAMILY_STATUSES = ['Middle Class', 'Upper Middle Class', 'Rich', 'Affluent'];
const HOROSCOPES = [
  'Mesh (Aries)', 'Vrishabh (Taurus)', 'Mithun (Gemini)', 'Kark (Cancer)', 'Singh (Leo)',
  'Kanya (Virgo)', 'Tula (Libra)', 'Vrishchik (Scorpio)', 'Dhanu (Sagittarius)',
  'Makar (Capricorn)', 'Kumbh (Aquarius)', 'Meen (Pisces)',
];
const NAKSHATRAS = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'];

const MOTHER_TONGUE_BY_STATE = {
  'Andhra Pradesh': 'Telugu', 'Arunachal Pradesh': 'Hindi', Assam: 'Assamese', Bihar: 'Hindi',
  Chhattisgarh: 'Hindi', Goa: 'Konkani', Gujarat: 'Gujarati', Haryana: 'Hindi',
  'Himachal Pradesh': 'Hindi', Jharkhand: 'Hindi', Karnataka: 'Kannada', Kerala: 'Malayalam',
  'Madhya Pradesh': 'Hindi', Maharashtra: 'Marathi', Manipur: 'Manipuri', Meghalaya: 'Khasi',
  Mizoram: 'Mizo', Nagaland: 'English', Odisha: 'Odia', Punjab: 'Punjabi', Rajasthan: 'Hindi',
  Sikkim: 'Nepali', 'Tamil Nadu': 'Tamil', Telangana: 'Telugu', Tripura: 'Bengali',
  'Uttar Pradesh': 'Hindi', Uttarakhand: 'Hindi', 'West Bengal': 'Bengali',
  'Delhi NCR': 'Hindi', 'Jammu & Kashmir': 'Kashmiri', Ladakh: 'Ladakhi', Puducherry: 'Tamil',
  Chandigarh: 'Punjabi',
};

const ABOUT_TEMPLATES = {
  MALE: [
    'I am a {profession} based in {city}, rooted in our {caste} community values. I believe in mutual respect, family harmony, and building a meaningful life together.',
    'Born and raised in {state}, I work as a {profession}. I enjoy reading, travel, and spending time with family. Seeking a sincere partner who values tradition and growth.',
    'Simple, grounded, and career-focused {profession} from {city}. Family-oriented person looking for a compatible match within our community.',
    'Professional {profession} with a calm temperament. I value honesty, culture, and a balanced lifestyle. Open to a partner who shares similar goals.',
  ],
  FEMALE: [
    'I am a {profession} from {city}, proud of our {caste} heritage. I enjoy cooking, music, and quality family time. Looking for a caring and responsible life partner.',
    'Educated {profession} with strong family values. Based in {state}, I seek a respectful partner who believes in partnership and shared dreams.',
    'Warm-hearted and ambitious {profession} from {city}. I balance career and tradition well, and hope to find a compatible match in our community.',
    'Family-oriented {profession} who values culture and compassion. Seeking a genuine partner for a happy, supportive married life.',
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = {
    perGender: 105,
    batch: 150,
    prefix: `state${Date.now()}`,
    religions: ['Hindu', 'Muslim', 'Sikh', 'Christian', 'Jain', 'Buddhist', 'Parsi', 'Jewish'],
    casteFilter: null,
    stateFilter: null,
    dryRun: false,
    skipExisting: true,
    premiumRatio: 0.12,
    males: null,
    females: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--per-gender' && argv[i + 1]) out.perGender = Math.max(1, parseInt(argv[++i], 10));
    else if (a === '--batch' && argv[i + 1]) out.batch = Math.max(1, parseInt(argv[++i], 10));
    else if (a === '--prefix' && argv[i + 1]) out.prefix = argv[++i];
    else if (a === '--religions' && argv[i + 1]) out.religions = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--caste' && argv[i + 1]) out.casteFilter = argv[++i];
    else if (a === '--state' && argv[i + 1]) out.stateFilter = argv[++i];
    else if (a === '--skip-existing') out.skipExisting = true;
    else if (a === '--force') out.skipExisting = false;
    else if (a === '--dry-run') out.dryRun = true;
    else if (a === '--premium-ratio' && argv[i + 1]) out.premiumRatio = Math.min(1, Math.max(0, parseFloat(argv[++i])));
    else if (a === '--males' && argv[i + 1]) out.males = Math.max(0, parseInt(argv[++i], 10));
    else if (a === '--females' && argv[i + 1]) out.females = Math.max(0, parseInt(argv[++i], 10));
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pick(arr, seed = null) {
  if (!arr?.length) return null;
  const idx = seed != null ? seed % arr.length : randomInt(0, arr.length);
  return arr[idx];
}

function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function emailSlug(part) {
  return String(part || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 24) || 'user';
}

function buildRealisticEmail(name, userId, usedEmails) {
  const parts = String(name || 'User Profile').trim().split(/\s+/).filter(Boolean);
  const first = emailSlug(parts[0]);
  const last = emailSlug(parts.length > 1 ? parts[parts.length - 1] : parts[0]);
  const num = 100 + (hashStr(`${userId}:${name}`) % 9899);
  let email = `${first}.${last}.${num}@gmail.com`;
  let suffix = 0;
  while (usedEmails?.has(email)) {
    suffix += 1;
    email = `${first}.${last}.${num}${suffix}@gmail.com`;
  }
  usedEmails?.add(email);
  return email;
}

function resolveCity(state, seed) {
  const cities = STATE_CITIES[state];
  if (!cities?.length) return state.split(' ')[0];
  return pick(cities, seed);
}

function resolveTargetStates(region) {
  if (region === 'Pan India') return [...INDIAN_STATES_UTS];
  if (region === 'North East') return [...NORTH_EAST_STATES];
  const mapped = REGION_TO_STATE[region] || region;
  if (INDIAN_STATES_UTS.includes(mapped)) return [mapped];
  return [];
}

function getNamePool(religion, state) {
  if (religion === 'Muslim') return NAMES_BY_REGION.Muslim;
  if (religion === 'Sikh') return NAMES_BY_REGION.Sikh;
  if (NAMES_BY_REGION[state]) return NAMES_BY_REGION[state];
  return NAMES_BY_REGION.default;
}

function perGenderCount(key, base) {
  const extra = hashStr(key) % 11;
  return base === 100 || base === 105 ? 100 + extra : base;
}

function matchesFilter(val, filter) {
  return val === filter || val.toLowerCase().includes(filter.toLowerCase());
}

/** Build seed plan: each item = one state × caste × perGender male + female */
function collectSeedPlan(religions, stateFilter, casteFilter, perGenderBase) {
  /** @type {Map<string, object[]>} */
  const byState = new Map(INDIAN_STATES_UTS.map((s) => [s, []]));

  for (const religion of religions) {
    for (const c of getCastesByReligion(religion)) {
      if (SKIP_CASTE_VALUES.has(c.val)) continue;
      if (casteFilter && !matchesFilter(c.val, casteFilter)) continue;

      for (const state of resolveTargetStates(c.region)) {
        if (stateFilter && state !== stateFilter && !state.toLowerCase().includes(stateFilter.toLowerCase())) continue;
        const dedupeKey = `${state}::${c.val}`;
        const list = byState.get(state);
        if (list.some((x) => `${state}::${x.val}` === dedupeKey)) continue;
        list.push({ ...c, religion, state });
      }
    }
  }

  const plan = [];
  for (const state of INDIAN_STATES_UTS) {
    const entries = byState.get(state) || [];
    for (const casteEntry of entries) {
      plan.push({
        state,
        casteEntry,
        perGender: perGenderCount(`${state}:${casteEntry.val}`, perGenderBase === 105 ? 100 : perGenderBase),
      });
    }
  }
  return { plan, byState };
}

async function loadExistingSeedCounts(conn) {
  const [rows] = await conn.query(`
    SELECT p.state, p.caste, p.gender, COUNT(*) AS cnt
    FROM \`user\` u
    JOIN profile p ON p.userId = u.id
    WHERE u.isSeedProfile = 1
    GROUP BY p.state, p.caste, p.gender
  `);
  /** @type {Map<string, { MALE: number, FEMALE: number }>} */
  const map = new Map();
  for (const r of rows) {
    const key = `${r.state}::${r.caste}`;
    if (!map.has(key)) map.set(key, { MALE: 0, FEMALE: 0 });
    const entry = map.get(key);
    if (r.gender === 'MALE') entry.MALE = r.cnt;
    else if (r.gender === 'FEMALE') entry.FEMALE = r.cnt;
  }
  return map;
}

function filterPlanForMissing(plan, existingMap) {
  const todo = [];
  let skippedCombos = 0;
  let partialCombos = 0;

  for (const item of plan) {
    const key = `${item.state}::${item.casteEntry.val}`;
    const existing = existingMap.get(key) || { MALE: 0, FEMALE: 0 };
    const maleNeed = Math.max(0, item.perGender - existing.MALE);
    const femaleNeed = Math.max(0, item.perGender - existing.FEMALE);

    if (maleNeed === 0 && femaleNeed === 0) {
      skippedCombos++;
      continue;
    }
    if (existing.MALE > 0 || existing.FEMALE > 0) partialCombos++;

    todo.push({
      ...item,
      maleStart: existing.MALE + 1,
      femaleStart: existing.FEMALE + 1,
      maleNeed,
      femaleNeed,
    });
  }

  const totalUsers = todo.reduce((s, p) => s + p.maleNeed + p.femaleNeed, 0);
  return { todo, skippedCombos, partialCombos, totalUsers };
}

function phoneUnique(globalIndex, runId) {
  const runBucket = String(Number(runId) % 1000).padStart(3, '0');
  const idx = String(globalIndex).padStart(6, '0');
  return `9${runBucket}${idx}`;
}

function randomDob(gender, seed) {
  const minAge = gender === 'MALE' ? 24 : 22;
  const maxAge = gender === 'MALE' ? 38 : 35;
  const age = minAge + (seed % (maxAge - minAge + 1));
  const month = seed % 12;
  const day = 1 + (seed % 28);
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(month);
  d.setDate(day);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function buildAbout(gender, ctx) {
  const templates = ABOUT_TEMPLATES[gender];
  const tpl = pick(templates, hashStr(ctx.email));
  return tpl
    .replace(/\{profession\}/g, ctx.profession)
    .replace(/\{city\}/g, ctx.city)
    .replace(/\{state\}/g, ctx.state)
    .replace(/\{caste\}/g, ctx.caste);
}

function needsGotra(casteEntry) {
  const cat = (casteEntry.category || '').toLowerCase();
  const val = (casteEntry.val || '').toLowerCase();
  return cat.includes('brahmin') || cat.includes('rajput') || cat.includes('kshatriya') || val.includes('brahmin') || val.includes('rajput');
}

function dietForReligion(religion) {
  if (religion === 'Muslim') return pick(['Halal', 'Non-Vegetarian', 'Vegetarian']);
  if (religion === 'Jain') return pick(['Jain Vegetarian', 'Vegetarian']);
  if (religion === 'Sikh') return pick(['Vegetarian', 'Eggetarian', 'Non-Vegetarian']);
  return pick(DIETS);
}

function buildProfile(globalIndex, gender, state, casteEntry, seqInCaste, prefix, passwordHash, now, premiumRatio, runId, usedEmails) {
  const { val: caste, religion, category } = casteEntry;
  const seed = hashStr(`${state}:${caste}:${gender}:${seqInCaste}:${globalIndex}`);
  const city = resolveCity(state, seed);
  const namePool = getNamePool(religion, state);

  const first = gender === 'MALE' ? pick(namePool.male, seed) : pick(namePool.female, seed + 7);
  let last = pick(namePool.last, seed + 13);
  if (religion === 'Sikh' && gender === 'FEMALE' && Math.random() < 0.7) last = 'Kaur';
  if (religion === 'Sikh' && gender === 'MALE') last = 'Singh';

  const name = `${first} ${last}`;
  const userId = randomUUID();
  const email = buildRealisticEmail(name, userId, usedEmails);
  const profileId = randomUUID();

  const profession = pick(PROFESSIONS, seed + 3);
  const education = pick(EDUCATIONS, seed + 5);
  const aboutMe = buildAbout(gender, { profession, city, state, caste, email });
  const height = gender === 'MALE' ? 165 + (seed % 24) : 152 + (seed % 21);
  const weight = gender === 'MALE' ? 58 + (seed % 33) : 45 + (seed % 28);
  const dob = randomDob(gender, seed);
  const motherTongue = MOTHER_TONGUE_BY_STATE[state] || pick(['Hindi', 'English', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Punjabi'], seed);
  const gotra = religion === 'Hindu' && needsGotra(casteEntry) ? pick(GOTRAS, seed) : null;
  const isPremium = Math.random() < premiumRatio ? 1 : 0;
  const partnerAgeMin = gender === 'MALE' ? 20 + (seed % 4) : 24 + (seed % 4);
  const partnerAgeMax = gender === 'MALE' ? 28 + (seed % 8) : 32 + (seed % 8);

  const userRow = [
    userId, name, email, now, null, passwordHash, phoneUnique(globalIndex, runId),
    1, 'USER', 1, 1, 1, 0, isPremium, null, null, 0, null,
    0, null, now, now, 1,
  ];

  const profileRow = [
    profileId, userId, gender, dob, height, weight, religion, caste, category || null,
    null, gotra, motherTongue, education, profession, pick(INCOMES, seed + 11),
    'India', state, city, aboutMe,
    'NEVER_MARRIED', 'NO', pick(['NO', 'NO', 'NO', 'OCCASIONALLY'], seed), dietForReligion(religion),
    pick(COMPLEXIONS, seed), pick(BODY_TYPES, seed + 1),
    pick(['Business', 'Government Employee', 'Retired', 'Farmer', 'Professional', 'Private Job'], seed),
    pick(['Homemaker', 'Teacher', 'Housewife', 'Professional', 'Government Employee'], seed + 2),
    seed % 4, pick(FAMILY_TYPES, seed), pick(FAMILY_STATUSES, seed),
    partnerAgeMin, partnerAgeMax,
    gender === 'MALE' ? height - 15 : null,
    gender === 'MALE' ? height - 5 : null,
    religion, pick(EDUCATIONS, seed + 9), 'India',
    pick(HOROSCOPES, seed), pick(NAKSHATRAS, seed + 19),
    pick(['No', 'No', 'Yes', 'Partial'], seed), 'Not Required', null,
    0, 1, 98, now, now,
    caste, pick(PROFESSIONS, seed + 17), 'NEVER_MARRIED', pick(['No', 'No', 'Yes'], seed), null,
  ];

  return { userRow, profileRow, email, name, gender, caste, religion, state };
}

function printHelp() {
  console.log(`
State + Caste Profile Seeder — Vivah Dwar

Har Indian state ke liye us state ki castes se male + female profiles insert karta hai.
Pan India castes har state me; North East castes saare NE states me.

Usage:
  node scripts/seed-caste-profiles.mjs --religions Hindu
  node scripts/seed-caste-profiles.mjs --state Gujarat --per-gender 100
  node scripts/seed-caste-profiles.mjs --state "Uttar Pradesh" --dry-run
  node scripts/seed-caste-profiles.mjs --caste "Leuva Patel" --state Gujarat

Options:
  --per-gender     Profiles per gender per (state × caste); default 105 = 100–110 range
  --batch          Insert batch size (default: 150)
  --prefix         Email prefix (default: state{timestamp})
  --religions      Hindu,Muslim,Sikh,... (default: all major)
  --state          Sirf ek state ke liye (e.g. Maharashtra, Bihar)
  --caste          Caste filter (partial match)
  --skip-existing  Pehle se bhari (state × caste) combos skip karo (default ON)
  --force          Sab dubara insert karo (skip band)
  --premium-ratio  Premium users fraction 0–1 (default: 0.12)
  --males          Exact male count (single state+caste mode)
  --females        Exact female count (single state+caste mode)
  --dry-run        Plan dikhao, DB me insert mat karo

Password for ALL users: ${PASSWORD_PLAIN}
Env: .env.production or .env (DATABASE_*)
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { printHelp(); process.exit(0); }

  const { plan, byState } = collectSeedPlan(args.religions, args.stateFilter, args.casteFilter, args.perGender);
  if (!plan.length) {
    console.error('❌ No state × caste combinations matched. Check --religions / --state / --caste.');
    process.exit(1);
  }

  const statesWithData = [...byState.entries()].filter(([, v]) => v.length > 0);
  const fullTotal = plan.reduce((s, p) => s + p.perGender * 2, 0);

  const host = process.env.DATABASE_HOST;
  const user = process.env.DATABASE_USER;
  const password = process.env.DATABASE_PASSWORD;
  const database = process.env.DATABASE_NAME;
  const port = parseInt(process.env.DATABASE_PORT || '3306', 10);

  if (!host || !user || !database) {
    console.error('❌ DATABASE_* env vars missing. Check .env or .env.production');
    process.exit(1);
  }

  const conn = await mysql.createConnection({ host, user, password, database, port });
  try {
    await conn.query('ALTER TABLE `user` ADD COLUMN `isSeedProfile` TINYINT(1) NOT NULL DEFAULT 0');
  } catch (e) {
    if (e.errno !== 1060) throw e;
  }
  let existingMap = new Map();
  if (args.skipExisting) {
    existingMap = await loadExistingSeedCounts(conn);
  }

  const { todo: workPlanRaw, skippedCombos, partialCombos, totalUsers: totalUsersRaw } = args.skipExisting
    ? filterPlanForMissing(plan, existingMap)
    : {
        todo: plan.map((p) => ({
          ...p, maleStart: 1, femaleStart: 1, maleNeed: p.perGender, femaleNeed: p.perGender,
        })),
        skippedCombos: 0,
        partialCombos: 0,
        totalUsers: fullTotal,
      };

  let workPlan = workPlanRaw;
  let totalUsers = totalUsersRaw;

  if (args.males != null || args.females != null) {
    const maleNeed = Math.max(0, args.males ?? 0);
    const femaleNeed = Math.max(0, args.females ?? 0);
    if (!maleNeed && !femaleNeed) {
      console.error('❌ --males or --females must be greater than 0');
      process.exit(1);
    }
    if (plan.length !== 1) {
      console.error('❌ --males/--females need exactly one state × caste. Use --state and --caste.');
      process.exit(1);
    }
    const item = plan[0];
    const key = `${item.state}::${item.casteEntry.val}`;
    const existing = existingMap.get(key) || { MALE: 0, FEMALE: 0 };
    workPlan = [{
      ...item,
      maleStart: existing.MALE + 1,
      femaleStart: existing.FEMALE + 1,
      maleNeed,
      femaleNeed,
    }];
    totalUsers = maleNeed + femaleNeed;
  }

  console.log('═══════════════════════════════════════════════');
  console.log('  Vivah Dwar — State-wise Profile Seeder');
  console.log('═══════════════════════════════════════════════');
  console.log(`  States       : ${statesWithData.length} / ${INDIAN_STATES_UTS.length}`);
  console.log(`  Combinations : ${plan.length.toLocaleString()} total (state × caste)`);
  if (args.skipExisting) {
    console.log(`  Skip existing: ${skippedCombos.toLocaleString()} already complete`);
    console.log(`  To insert    : ${workPlan.length.toLocaleString()} combos (${partialCombos} partial top-up)`);
  }
  console.log(`  Per gender   : ~${args.perGender === 105 ? '100–110' : args.perGender} per combination`);
  console.log(`  Insert count : ${totalUsers.toLocaleString()} profiles`);
  console.log(`  Religions    : ${args.religions.join(', ')}`);
  if (args.stateFilter) console.log(`  State filter : ${args.stateFilter}`);
  console.log(`  Photos       : NONE (hidePhoto=1)`);
  console.log(`  Password     : ${PASSWORD_PLAIN}`);
  if (args.dryRun) console.log('  Mode         : DRY RUN');
  console.log('═══════════════════════════════════════════════\n');

  if (args.dryRun) {
    console.log('Har state ka breakdown — insert hoga (pehle 15 states):');
    statesWithData.slice(0, 15).forEach(([state, entries]) => {
      const stateTodo = workPlan.filter((p) => p.state === state);
      const stateInsert = stateTodo.reduce((s, p) => s + p.maleNeed + p.femaleNeed, 0);
      console.log(`  • ${state}: ${stateTodo.length}/${entries.length} castes → ${stateInsert.toLocaleString()} new profiles`);
    });
    if (statesWithData.length > 15) console.log(`  … aur ${statesWithData.length - 15} states`);
    console.log('\nSample pending:');
    workPlan.slice(0, 8).forEach((p) => console.log(`  • ${p.state} / ${p.casteEntry.val} → +${p.maleNeed}M +${p.femaleNeed}F`));
    await conn.end();
    process.exit(0);
  }

  if (!workPlan.length) {
    console.log('✅ Sab state × caste combos pehle se complete hain. Kuch insert nahi karna.');
    await conn.end();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const runId = String(Date.now() + hashStr(args.prefix));

  const userSql = `INSERT INTO \`user\`
    (id, name, email, emailVerified, image, password, phone, phoneVerified, role, isActive, isVerified,
     adminVerified, verificationBadge, isPremium, premiumExpiry, premiumPlan, profileBoost, boostExpiry,
     loginOtpEnabled, lastLoginAt, createdAt, updatedAt, isSeedProfile)
    VALUES ?`;

  const profileSql = `INSERT INTO profile
    (id, userId, gender, dob, height, weight, religion, caste, subCaste, sect, gotra, motherTongue,
     education, profession, income, country, state, city, aboutMe, maritalStatus, smoking, drinking, diet,
     complexion, bodyType, fatherOccupation, motherOccupation, siblings, familyType, familyStatus,
     partnerAgeMin, partnerAgeMax, partnerHeightMin, partnerHeightMax,
     partnerReligion, partnerEducation, partnerLocation,
     horoscopeSign, nakshatra, manglik, kundliMatch, amritdhari, hidePhone, hidePhoto,
     profileComplete, createdAt, updatedAt,
     partnerCaste, partnerProfession, partnerMaritalStatus, partnerManglik, introVideoUrl)
    VALUES ?`;

  const [[seedCountRow]] = await conn.query('SELECT COUNT(*) AS c FROM `user` WHERE isSeedProfile = 1');
  const [existingEmailRows] = await conn.query('SELECT LOWER(email) AS email FROM `user`');
  const usedEmails = new Set(existingEmailRows.map((r) => r.email));
  let globalIndex = Number(seedCountRow.c) + 1000;
  let inserted = 0;
  const startTime = Date.now();
  let sampleLogins = [];

  for (const item of workPlan) {
    const { state, casteEntry, maleStart, femaleStart, maleNeed, femaleNeed } = item;
    const queue = [];

    for (let i = 0; i < maleNeed; i++) {
      const seq = maleStart + i;
      queue.push(buildProfile(globalIndex++, 'MALE', state, casteEntry, seq, args.prefix, passwordHash, now, args.premiumRatio, runId, usedEmails));
    }
    for (let i = 0; i < femaleNeed; i++) {
      const seq = femaleStart + i;
      queue.push(buildProfile(globalIndex++, 'FEMALE', state, casteEntry, seq, args.prefix, passwordHash, now, args.premiumRatio, runId, usedEmails));
    }

    for (let i = 0; i < queue.length; i += args.batch) {
      const chunk = queue.slice(i, i + args.batch);
      const userRows = chunk.map((u) => u.userRow);
      const profileRows = chunk.map((u) => u.profileRow);

      await conn.beginTransaction();
      try {
        await conn.query(userSql, [userRows]);
        await conn.query(profileSql, [profileRows]);
        await conn.commit();
      } catch (err) {
        await conn.rollback();
        console.error(`\n❌ Failed at ${state} / "${casteEntry.val}" (${casteEntry.religion}):`, err.message);
        if (err.code === 'ER_DUP_ENTRY') console.error('   Tip: use a new --prefix or clear old seed data.');
        await conn.end();
        process.exit(1);
      }

      inserted += chunk.length;
      if (sampleLogins.length < 6) {
        sampleLogins.push(...chunk.slice(0, 6 - sampleLogins.length).map((u) => ({
          email: u.email, name: u.name, state: u.state, caste: u.caste, gender: u.gender,
        })));
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (inserted / (elapsed || 1)).toFixed(0);
      const pct = ((inserted / totalUsers) * 100).toFixed(1);
      process.stdout.write(`\r  ✅ ${inserted.toLocaleString()}/${totalUsers.toLocaleString()} (${pct}%) — ${elapsed}s — ~${rate}/sec   `);
    }
  }

  await conn.end();

  console.log('\n\n🎉 State-wise seed complete!\n');
  console.log('Sample logins (password for all):', PASSWORD_PLAIN);
  sampleLogins.forEach((s) => console.log(`  • ${s.email}  (${s.name}, ${s.gender}, ${s.state}, ${s.caste})`));
  console.log(`\nTotal inserted : ${inserted.toLocaleString()} users (this run)`);
  console.log(`Skipped        : ${skippedCombos.toLocaleString()} already-complete combos`);
  console.log(`States in plan : ${statesWithData.length}`);
  console.log(`Combinations   : ${workPlan.length.toLocaleString()} inserted / ${plan.length.toLocaleString()} total`);
  console.log('Photos           : none (profiles have hidePhoto=1)\n');
}

main().catch((err) => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
