# External Databases

## Assumption

Every school has a database of their students, teachers and admins
And every student has an email address of their school or another form of login which is unique in Germany

## Motivation

The notification service should not have direct access to this sensitive data. 
It should only be saved at a single place at every school. 
The notification service only saves an id and the email for every student but not the password and where to find the data in the external database. 
Additional it saves which apps are connected to the notification service. 

## Functions

| call                           | return                                   |
| ------------------------------ | ---------------------------------------- |
| `login(username,pw (gehasht))` | `true(position [student,teacher,admin])` or `false` |
| `getClass(className, school)`  | `listOfAllStudentsInClass (email)`       |
| `getSchool(school)`            | `list`                                   |
| `getTeachers(school)`          | `list`                                   |
| `getStaff(school)`             | `list`                                   |



 