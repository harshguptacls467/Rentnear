const supabase = require('./config/supabase');

const email = 'harshguptacls467@gmail.com';
const password = 'Harsh@130724';
const name = 'Harsh Gupta';

async function run() {
  console.log(`Checking if user ${email} exists in auth...`);
  
  try {
    const { data, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Error listing users:', listError);
      process.exit(1);
    }
    
    const users = data?.users || [];
    let user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    let userId;
    
    if (user) {
      console.log(`User already exists in Auth with ID: ${user.id}. Updating password and confirming email...`);
      userId = user.id;
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        password: password,
        email_confirm: true
      });
      if (updateError) {
        console.error('Error updating user password:', updateError);
        process.exit(1);
      }
      console.log('Password updated and email confirmed successfully.');
    } else {
      console.log(`User does not exist. Creating new user via admin auth client...`);
      const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { name: name }
      });
      if (createError) {
        console.error('Error creating user:', createError);
        process.exit(1);
      }
      userId = createData.user?.id;
      console.log(`User created successfully with ID: ${userId}`);
    }
    
    // 2. Upsert profile in public.users
    console.log(`Upserting profile in public.users table...`);
    const { error: profileError } = await supabase
      .from('users')
      .upsert([{
        id: userId,
        email: email,
        name: name,
        is_admin: true,
        admin_status: 'approved',
        role: 'both',
        kyc_verified: true,
        kyc_status: 'verified',
        email_verified: true
      }], { onConflict: 'id' });
      
    if (profileError) {
      console.error('Error upserting profile in database:', profileError);
      process.exit(1);
    }
    
    console.log('Profile successfully set as APPROVED ADMIN in public.users!');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

run();
