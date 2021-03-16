drop table if exists yelp;

create table yelp(
  id serial primary key,
  name varchar(255),
  image_url varchar(255),
  price varchar(255),
  rating varchar(255),
  url varchar(255)
)