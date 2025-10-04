// Domain Connection Diagnostic and Fix Script
// Run this in your browser console on the admin dashboard

console.log('🔍 Domain Connection Diagnostic Script');
console.log('=====================================');

// Function to check domain connections
async function checkDomainConnections() {
  try {
    console.log('📋 Checking domain connections...');
    
    // Get all domains
    const { data: domains, error: domainsError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('domain', 'store.powerkits.net');
    
    if (domainsError) {
      console.error('❌ Error fetching domains:', domainsError);
      return;
    }
    
    console.log('🌐 Domains found:', domains);
    
    if (domains && domains.length > 0) {
      const domain = domains[0];
      console.log('✅ Domain found:', domain.domain);
      console.log('   - ID:', domain.id);
      console.log('   - Store ID:', domain.store_id);
      console.log('   - Verified:', domain.is_verified);
      console.log('   - DNS Configured:', domain.dns_configured);
      
      // Check connections for this domain
      const { data: connections, error: connectionsError } = await supabase
        .from('domain_connections')
        .select('*')
        .eq('domain_id', domain.id);
      
      if (connectionsError) {
        console.error('❌ Error fetching connections:', connectionsError);
        return;
      }
      
      console.log('🔗 Connections found:', connections);
      
      if (!connections || connections.length === 0) {
        console.log('❌ NO CONNECTIONS FOUND! This is the problem.');
        console.log('🔧 The domain exists but is not connected to any content.');
        
        // Get available websites and funnels
        const { data: websites, error: websitesError } = await supabase
          .from('websites')
          .select('*')
          .eq('store_id', domain.store_id)
          .eq('is_active', true);
        
        const { data: funnels, error: funnelsError } = await supabase
          .from('funnels')
          .select('*')
          .eq('store_id', domain.store_id)
          .eq('is_active', true);
        
        console.log('📄 Available websites:', websites);
        console.log('🎯 Available funnels:', funnels);
        
        console.log('\n🔧 TO FIX THIS ISSUE:');
        console.log('1. Go to admin dashboard → Domains');
        console.log('2. Find store.powerkits.net');
        console.log('3. Click "Connect Content"');
        console.log('4. Choose Website or Funnel');
        console.log('5. Select the appropriate content');
        console.log('6. Save the connection');
        
        return { needsFix: true, domain, websites, funnels };
      } else {
        console.log('✅ Connections found:', connections.length);
        connections.forEach(conn => {
          console.log(`   - Type: ${conn.content_type}`);
          console.log(`   - Content ID: ${conn.content_id}`);
          console.log(`   - Path: ${conn.path}`);
          console.log(`   - Homepage: ${conn.is_homepage}`);
        });
        return { needsFix: false, domain, connections };
      }
    } else {
      console.log('❌ Domain not found in database');
      return { needsFix: true, error: 'Domain not found' };
    }
  } catch (error) {
    console.error('❌ Script error:', error);
    return { needsFix: true, error: error.message };
  }
}

// Function to create a connection (if you want to automate it)
async function createDomainConnection(domainId, contentType, contentId, path = '/', isHomepage = true) {
  try {
    console.log('🔧 Creating domain connection...');
    
    const { data, error } = await supabase
      .from('domain_connections')
      .insert({
        domain_id: domainId,
        store_id: (await supabase.from('custom_domains').select('store_id').eq('id', domainId).single()).data.store_id,
        content_type: contentType,
        content_id: contentId,
        path: path,
        is_homepage: isHomepage
      })
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating connection:', error);
      return { success: false, error };
    }
    
    console.log('✅ Connection created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Script error:', error);
    return { success: false, error: error.message };
  }
}

// Run the diagnostic
checkDomainConnections().then(result => {
  console.log('\n📊 DIAGNOSTIC RESULT:');
  console.log('====================');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.needsFix) {
    console.log('\n🚨 ACTION REQUIRED:');
    console.log('The domain store.powerkits.net needs to be connected to content.');
    console.log('This is why EPS/EB Pay payments are getting 404 errors.');
  } else {
    console.log('\n✅ DOMAIN IS PROPERLY CONFIGURED');
  }
});

// Export functions for manual use
window.domainDiagnostic = {
  check: checkDomainConnections,
  create: createDomainConnection
};

console.log('\n💡 You can also run:');
console.log('   domainDiagnostic.check() - to check again');
console.log('   domainDiagnostic.create(domainId, "website", websiteId) - to create connection');
